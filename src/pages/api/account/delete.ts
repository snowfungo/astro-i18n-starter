import type { APIRoute } from "astro";

import { deleteAccountData } from "@/lib/server/account/service";
import { clearSession, getCurrentSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await getCurrentSession(context);
    if (!session) {
        return json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = Number(session.sub);
    await deleteAccountData(userId);
    await clearSession(context, userId);
    return json({ ok: true });
};
