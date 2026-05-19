import type { APIRoute } from "astro";

import { getStats } from "@/lib/server/generation/service";
import { json } from "@/lib/server/http";
import { ensureAppReady } from "@/lib/server/startup";

export const GET: APIRoute = async () => {
    await ensureAppReady();
    return json(await getStats());
};
