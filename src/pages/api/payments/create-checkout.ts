import type { APIRoute } from "astro";

import { parseJsonBody, requireSession, badRequest } from "@/lib/server/api";
import { createCheckoutSession, getSupportedCheckoutPlans } from "@/lib/server/billing/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const auth = await requireSession(context);
    if (!auth.session) {
        return auth.response!;
    }

    const body = await parseJsonBody<{ plan?: string }>(context.request);
    const supportedPlans = new Set(getSupportedCheckoutPlans());
    if (!body?.plan || !supportedPlans.has(body.plan as any)) {
        return badRequest("Invalid plan");
    }

    const result = await createCheckoutSession(Number(auth.session.sub), body.plan as any);
    return json(result);
};
