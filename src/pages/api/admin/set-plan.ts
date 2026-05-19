import type { APIRoute } from "astro";

import { setPlanAdmin } from "@/lib/server/billing/service";
import { getCurrentSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await getCurrentSession(context);
    if (!session) {
        return json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.role !== "admin") {
        return json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await context.request.json().catch(() => null) as { userId?: number; plan?: string } | null;
    if (!body?.userId || !body.plan) {
        return json({ error: "Invalid payload" }, { status: 400 });
    }

    try {
        return json(await setPlanAdmin(body.userId, body.plan));
    } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Operation failed" }, { status: 400 });
    }
};
