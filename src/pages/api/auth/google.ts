import type { APIRoute } from "astro";

import { getGoogleAuthUrl } from "@/lib/server/auth/google";
import { serverEnv } from "@/lib/server/config/env";

export const GET: APIRoute = async () => {
    const hasGoogle = Boolean(serverEnv.googleClientId && serverEnv.googleClientSecret);
    const location = hasGoogle ? getGoogleAuthUrl() : "/api/auth/mock-login";
    return new Response(null, {
        status: 302,
        headers: {
            Location: location,
        },
    });
};
