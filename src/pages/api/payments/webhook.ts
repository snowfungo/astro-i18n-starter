import type { APIRoute } from "astro";

import { handleStripeWebhook } from "@/lib/server/billing/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async ({ request }) => {
    await ensureAppReady();
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    return json(await handleStripeWebhook(payload, signature));
};
