import type { APIContext } from "astro";
import { createHash } from "node:crypto";
import { isIP } from "node:net";

import { serverEnv } from "@/lib/server/config/env";
import { get, run, transaction } from "@/lib/server/db/client";
import { nowIso } from "@/lib/server/db/utils";

function splitCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeIp(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return isIP(trimmed) ? trimmed : null;
}

export function resolveClientIp(context: APIContext) {
  const remote =
    normalizeIp(context.request.headers.get("cf-connecting-ip")) ??
    normalizeIp(context.clientAddress) ??
    "0.0.0.0";

  for (const headerName of splitCsv(serverEnv.clientIpHeaderOrder)) {
    const raw = context.request.headers.get(headerName);
    if (!raw) {
      continue;
    }
    const candidates = headerName.toLowerCase() === "x-forwarded-for" ? raw.split(",") : [raw];
    for (const candidate of candidates) {
      const normalized = normalizeIp(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }
  return remote;
}

export function hashClientIp(clientIp: string) {
  return createHash("sha256")
    .update(`${serverEnv.secretKey}:${clientIp}`)
    .digest("hex");
}

function usageDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function nextUtcMidnight(now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.toISOString().replace(".000Z", "Z");
}

export async function reserveAnonymousQuota(context: APIContext) {
  const limit = serverEnv.anonImageDailyLimit;
  const clientIp = resolveClientIp(context);
  const ipHash = hashClientIp(clientIp);
  const currentUsageDate = usageDate();
  const resetAt = nextUtcMidnight();

  if (!serverEnv.anonQuotaEnabled) {
    return {
      allowed: true,
      limit,
      used: 0,
      remaining: limit,
      reset_at: resetAt,
      client_ip: clientIp,
    };
  }

  return await transaction(async () => {
    const row = await get<{ used_count: number }>(
      `SELECT used_count FROM anonymous_image_usage WHERE usage_date = ? AND ip_hash = ?`,
      [currentUsageDate, ipHash],
    );
    const used = Number(row?.used_count ?? 0);
    if (used >= limit) {
      return {
        allowed: false,
        limit,
        used,
        remaining: 0,
        reset_at: resetAt,
        client_ip: clientIp,
      };
    }

    const nextUsed = used + 1;
    if (row) {
      await run(
        `UPDATE anonymous_image_usage SET used_count = ?, last_seen_at = ?
         WHERE usage_date = ? AND ip_hash = ?`,
        [nextUsed, nowIso(), currentUsageDate, ipHash],
      );
    } else {
      await run(
        `INSERT INTO anonymous_image_usage (usage_date, ip_hash, used_count, first_seen_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?)`,
        [currentUsageDate, ipHash, nextUsed, nowIso(), nowIso()],
      );
    }

    return {
      allowed: true,
      limit,
      used: nextUsed,
      remaining: Math.max(0, limit - nextUsed),
      reset_at: resetAt,
      client_ip: clientIp,
    };
  });
}

export async function refundAnonymousQuota(context: APIContext) {
  const clientIp = resolveClientIp(context);
  const ipHash = hashClientIp(clientIp);
  await run(
    `UPDATE anonymous_image_usage
     SET used_count = CASE WHEN used_count > 0 THEN used_count - 1 ELSE 0 END,
         last_seen_at = ?
     WHERE usage_date = ? AND ip_hash = ?`,
    [nowIso(), usageDate(), ipHash],
  );
}
