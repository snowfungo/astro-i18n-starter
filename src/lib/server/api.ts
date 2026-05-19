import type { APIContext } from "astro";

import { getCurrentSession } from "@/lib/server/auth/session";
import type { SessionPayload } from "@/lib/server/auth/tokens";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export async function getJsonBody<T>(request: Request): Promise<T> {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        throw new Error("Expected JSON request body");
    }
    return (await request.json()) as T;
}

export async function getOptionalJsonBody<T>(request: Request): Promise<T | null> {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        return null;
    }
    return (await request.json()) as T;
}

export function getQueryNumber(url: URL, key: string, fallback: number) {
    const value = url.searchParams.get(key);
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export async function withApi(
    context: APIContext,
    handler: (session: SessionPayload | null) => Promise<Response> | Response,
) {
    try {
        await ensureAppReady();
        const session = await getCurrentSession(context);
        return await handler(session);
    } catch (error) {
        return json(
            {
                error: error instanceof Error ? error.message : "Unexpected server error",
            },
            { status: 500 },
        );
    }
}

export function badRequest(message: string, status = 400) {
    return json({ error: message }, { status });
}

export function unauthorized(message = "Not authenticated") {
    return json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
    return json({ error: message }, { status: 403 });
}

export function parseJsonBody<T>(request: Request): Promise<T | null> {
    return request.json().catch(() => null) as Promise<T | null>;
}

export async function requireSession(context: APIContext) {
    const session = await getCurrentSession(context);
    if (!session) {
        return { session: null, response: unauthorized() };
    }
    return { session };
}

export async function requireAdminSession(context: APIContext) {
    const result = await requireSession(context);
    if (!result.session) {
        return result;
    }
    if (result.session.role !== "admin") {
        return { session: null, response: forbidden("Admin access required") };
    }
    return result;
}
