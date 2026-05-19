import type { APIRoute } from "astro";

import { refreshSession } from "@/lib/server/auth/session";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const POST: APIRoute = async (context) => {
    await ensureAppReady();
    const session = await refreshSession(context);
    if (!session) {
        return json({ authenticated: false }, { status: 401 });
    }
    return json({ authenticated: true, session });
};
