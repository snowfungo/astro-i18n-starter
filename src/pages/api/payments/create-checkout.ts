import type { APIRoute } from "astro";

import { createCheckoutSession } from "@/lib/server/billing/service";
import { getCurrentSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await getCurrentSession(context);
    if (!session) {
        return json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await context.request.json().catch(() => null) as { plan?: string } | null;
    const plan = body?.plan;
    if (!plan || !["starter", "standard", "value"].includes(plan)) {
        return json({ error: "Invalid plan" }, { status: 400 });
    }

    const result = await createCheckoutSession(Number(session.sub), plan as any);
    return json(result);
};
