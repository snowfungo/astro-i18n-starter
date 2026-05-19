import type { APIRoute } from "astro";

import { clearSession, getCurrentSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const ALL: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await getCurrentSession(context);
    await clearSession(context, session ? Number(session.sub) : undefined);
    return json({ ok: true });
};
