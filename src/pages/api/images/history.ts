import type { APIRoute } from "astro";

import { getCurrentSession } from "@/lib/server/auth/session";
import { getHistory } from "@/lib/server/generation/service";
import { json } from "@/lib/server/http";
import { serverEnv } from "@/lib/server/config/env";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await getCurrentSession(context);
    const sessionId = context.cookies.get(serverEnv.cookieSessionId)?.value ?? null;
    const items = await getHistory({ userId: session ? Number(session.sub) : null, sessionId });
    return json({ items });
};
