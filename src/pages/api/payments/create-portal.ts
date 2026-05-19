import type { APIRoute } from "astro";

import { requireSession } from "@/lib/server/api";
import { createPortalSession } from "@/lib/server/billing/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const auth = await requireSession(context);
    if (!auth.session) {
        return auth.response!;
    }
    return json(await createPortalSession(Number(auth.session.sub)));
};
