import type { APIRoute } from "astro";

import { listAdminUsers } from "@/lib/server/billing/service";
import { getCurrentSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await getCurrentSession(context);
    if (!session) {
        return json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.role !== "admin") {
        return json({ error: "Admin access required" }, { status: 403 });
    }
    return json({ items: await listAdminUsers() });
};
