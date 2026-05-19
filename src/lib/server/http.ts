import type { APIContext } from "astro";

import { isProduction, serverEnv } from "@/lib/server/config/env";

export function json(data: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), {
        ...init,
        headers,
    });
}

export function setCookie(
    context: APIContext,
    name: string,
    value: string,
    maxAge: number,
    path = "/",
) {
    context.cookies.set(name, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path,
        maxAge,
    });
}

export function deleteCookie(context: APIContext, name: string, path = "/") {
    context.cookies.delete(name, {
        path,
    });
}

export function getOriginUrl() {
    return new URL(serverEnv.appUrl);
}
