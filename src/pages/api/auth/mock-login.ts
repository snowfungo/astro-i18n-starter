import type { APIRoute } from "astro";

import { createSessionForUser } from "@/lib/server/auth/session";
import { ensureMockUser } from "@/lib/server/auth/users";
import { serverEnv } from "@/lib/server/config/env";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async (context) => {
    await ensureAppReady();
    const user = await ensureMockUser({
        email: serverEnv.mockUserEmail,
        name: "Local Test User",
        role: serverEnv.adminUsers.includes(serverEnv.mockUserEmail) ? "admin" : "user",
    });
    await createSessionForUser(context, user);
    return new Response(null, { status: 302, headers: { Location: "/dashboard?auth=mock" } });
};
