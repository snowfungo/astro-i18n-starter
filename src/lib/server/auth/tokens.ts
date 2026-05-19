import { SignJWT, jwtVerify } from "jose";

import { serverEnv } from "@/lib/server/config/env";
import { nowIso, sha256 } from "@/lib/server/db/utils";

const secret = new TextEncoder().encode(serverEnv.secretKey);
const accessTokenTtlSeconds = 60 * 30;
const refreshTokenTtlSeconds = 60 * 60 * 24 * 7;

export type SessionPayload = {
    sub: string;
    email: string;
    name: string;
    role?: string;
    is_test?: boolean;
};

export async function createAccessToken(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${accessTokenTtlSeconds}s`)
        .sign(secret);
}

export async function verifyAccessToken(token: string) {
    const result = await jwtVerify(token, secret);
    return result.payload as SessionPayload & { exp: number; iat: number };
}

export function createRefreshToken() {
    return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}

export function hashRefreshToken(token: string) {
    return sha256(token);
}

export function getRefreshTokenExpiresAt() {
    return new Date(Date.now() + refreshTokenTtlSeconds * 1000).toISOString();
}

export { accessTokenTtlSeconds, refreshTokenTtlSeconds, nowIso };
