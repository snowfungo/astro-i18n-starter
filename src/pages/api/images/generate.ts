import type { APIRoute } from "astro";

import { getCurrentSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { generateChibi } from "@/lib/server/generation/service";
import { ensureAppReady } from "@/lib/server/startup";
import { serverEnv } from "@/lib/server/config/env";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const form = await context.request.formData();
    const prompt = String(form.get("prompt") ?? "").trim();
    const style = String(form.get("style") ?? "classic");
    const image = form.get("image");
    const session = await getCurrentSession(context);
    const sessionId =
        context.cookies.get(serverEnv.cookieSessionId)?.value ??
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    let imageBytes: Uint8Array | null = null;
    let imageName: string | null = null;
    let imageType: string | null = null;

    if (image instanceof File && image.size > 0) {
        if (image.size > serverEnv.maxRequestBodySize) {
            return json({ error: "Image must be smaller than 8MB" }, { status: 413 });
        }
        imageBytes = new Uint8Array(await image.arrayBuffer());
        imageName = image.name;
        imageType = image.type || "application/octet-stream";
    }

    const result = await generateChibi({
        context,
        session: { userId: session ? Number(session.sub) : null, sessionId },
        prompt,
        style: ["classic", "kawaii", "avatar", "emoji"].includes(style) ? (style as any) : "classic",
        imageBytes,
        imageName,
        imageType,
    });

    context.cookies.set(serverEnv.cookieSessionId, sessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
    });

    return json(result.body, { status: result.status });
};
