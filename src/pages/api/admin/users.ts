import type { APIRoute } from "astro";

import { requireAdminSession } from "@/lib/server/api";
import { listAdminUsers } from "@/lib/server/billing/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async (context) => {
    await ensureAppReady();
    const auth = await requireAdminSession(context);
    if (!auth.session) {
        return auth.response!;
    }
    return json({ items: await listAdminUsers() });
};
