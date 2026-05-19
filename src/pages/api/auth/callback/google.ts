import type { APIRoute } from "astro";

import { exchangeGoogleCode, getDashboardUrl } from "@/lib/server/auth/google";
import { createSessionForUser } from "@/lib/server/auth/session";
import { upsertGoogleUser } from "@/lib/server/auth/users";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async (context) => {
    await ensureAppReady();
    const code = context.url.searchParams.get("code");
    if (!code) {
        return new Response(null, { status: 302, headers: { Location: "/dashboard?auth=missing_code" } });
    }

    try {
        const profile = await exchangeGoogleCode(code);
        const user = await upsertGoogleUser({
            googleId: profile.sub,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.picture,
        });
        await createSessionForUser(context, user);
        return new Response(null, {
            status: 302,
            headers: { Location: getDashboardUrl() },
        });
    } catch {
        return new Response(null, { status: 302, headers: { Location: "/dashboard?auth=failed" } });
    }
};
