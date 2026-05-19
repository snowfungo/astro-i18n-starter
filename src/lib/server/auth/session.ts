import type { APIContext } from "astro";

import { isDevelopment, serverEnv } from "@/lib/server/config/env";
import { get, run } from "@/lib/server/db/client";
import { nowIso } from "@/lib/server/db/utils";
import { deleteCookie, setCookie } from "@/lib/server/http";
import {
  accessTokenTtlSeconds,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  type SessionPayload,
  verifyAccessToken,
} from "@/lib/server/auth/tokens";
import { ensureSubscription } from "@/lib/server/auth/subscriptions";
import { ensureMockUser, getUserById } from "@/lib/server/auth/users";

type RefreshTokenRow = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  revoked: number;
  created_at: string;
};

function buildPayload(user: {
  id: number;
  email: string;
  name: string | null;
  role: string;
}) {
  return {
    sub: String(user.id),
    email: user.email,
    name: user.name ?? user.email,
    role: user.role,
  } satisfies SessionPayload;
}

export async function createSessionForUser(
  context: APIContext,
  user: { id: number; email: string; name: string | null; role: string },
) {
  await ensureSubscription(user.id);
  const payload = buildPayload(user);
  const accessToken = await createAccessToken(payload);
  const refreshToken = createRefreshToken();

  await run(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked, created_at)
     VALUES (?, ?, ?, 0, ?)`,
    [user.id, hashRefreshToken(refreshToken), getRefreshTokenExpiresAt(), nowIso()],
  );

  setCookie(context, serverEnv.cookieAccessToken, accessToken, accessTokenTtlSeconds, "/");
  setCookie(context, serverEnv.cookieRefreshToken, refreshToken, 60 * 60 * 24 * 7, "/api/auth");

  return payload;
}

export async function clearSession(context: APIContext, userId?: number) {
  if (userId) {
    await run(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`, [userId]);
  }
  deleteCookie(context, serverEnv.cookieAccessToken, "/");
  deleteCookie(context, serverEnv.cookieRefreshToken, "/api/auth");
}

export async function getCurrentSession(context: APIContext) {
  const devBypass = await getDevBypassSession(context);
  if (devBypass) {
    return devBypass;
  }

  const token = context.cookies.get(serverEnv.cookieAccessToken)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export function requireSession(session: SessionPayload | null) {
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

export function requireAdminSession(session: SessionPayload | null) {
  const authSession = requireSession(session);
  if (authSession.role !== "admin") {
    throw new Error("Admin access required");
  }
  return authSession;
}

export async function getDevBypassSession(context: APIContext) {
  if (!isDevelopment || !serverEnv.devApiTestKey) {
    return null;
  }

  const requestKey = context.request.headers.get("x-test-key");
  const confirmed = context.request.headers.get("x-test-confirm");
  if (requestKey !== serverEnv.devApiTestKey || confirmed !== "true") {
    return null;
  }

  const user = await ensureMockUser({
    email: serverEnv.mockUserEmail,
    name: "Test User",
    role: serverEnv.adminUsers.includes(serverEnv.mockUserEmail) ? "admin" : "user",
  });
  await ensureSubscription(user.id);
  return {
    sub: String(user.id),
    email: user.email,
    name: user.name ?? "Test User",
    role: user.role,
    is_test: true,
  } satisfies SessionPayload;
}

export async function refreshSession(context: APIContext) {
  const refreshToken = context.cookies.get(serverEnv.cookieRefreshToken)?.value;
  if (!refreshToken) {
    return null;
  }

  const row = await get<RefreshTokenRow>(
    `SELECT id, user_id, token_hash, expires_at, revoked, created_at
     FROM refresh_tokens WHERE token_hash = ?`,
    [hashRefreshToken(refreshToken)],
  );

  if (!row || row.revoked || new Date(row.expires_at).getTime() < Date.now()) {
    return null;
  }

  const user = await getUserById(row.user_id);
  if (!user) {
    return null;
  }

  await run(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`, [row.id]);
  return await createSessionForUser(context, user);
}
