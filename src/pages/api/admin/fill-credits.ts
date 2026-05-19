import type { APIRoute } from "astro";

import { parseJsonBody, requireAdminSession, badRequest } from "@/lib/server/api";
import { fillCreditsAdmin } from "@/lib/server/billing/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const auth = await requireAdminSession(context);
    if (!auth.session) {
        return auth.response!;
    }

    const body = await parseJsonBody<{ userId?: number; amount?: number }>(context.request);
    if (!body?.userId || typeof body.amount !== "number") {
        return badRequest("Invalid payload");
    }

    try {
        return json(await fillCreditsAdmin(body.userId, body.amount));
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Operation failed" }, { status: 400 });
    }
};
