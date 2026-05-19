import type { APIRoute } from "astro";

import { ensureSubscription } from "@/lib/server/auth/subscriptions";
import { getCurrentSession, refreshSession } from "@/lib/server/auth/session";
import { getUserById } from "@/lib/server/auth/users";
import { getCreditsSummary } from "@/lib/server/credits/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async (context) => {
    await ensureAppReady();
    let session = await getCurrentSession(context);
    if (!session) {
        session = await refreshSession(context);
    }
    if (!session) {
        return json({ authenticated: false }, { status: 401 });
    }

    const userId = Number(session.sub);
    const user = await getUserById(userId);
    const subscription = await ensureSubscription(userId);
    const credits = await getCreditsSummary(userId);

    return json({
        authenticated: true,
        user,
        session,
        subscription,
        credits,
    });
};
