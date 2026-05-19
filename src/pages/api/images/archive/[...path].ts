import type { APIRoute } from "astro";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { serverEnv } from "@/lib/server/config/env";

export const GET: APIRoute = async ({ params }) => {
    const requested = params.path ?? "";
    if (!requested || requested.includes("..") || requested.startsWith("/")) {
        return new Response("Invalid path", { status: 400 });
    }

    const localPath = resolve("runtime/generated/chibi", requested);
    if (existsSync(localPath)) {
        const content = readFileSync(localPath);
        return new Response(content, {
            headers: {
                "Content-Type": requested.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream",
                "Cache-Control": "public, max-age=300",
            },
        });
    }

    const upstream = await fetch(`${serverEnv.aiContentServiceUrl.replace(/\/$/, "")}/archive/${requested}`);
    if (!upstream.ok) {
        return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
    }

    return new Response(await upstream.arrayBuffer(), {
        headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
            "Cache-Control": upstream.headers.get("cache-control") ?? "public, max-age=300",
        },
    });
};
