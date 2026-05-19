import type { APIRoute } from "astro";

import { ensureAppReady } from "@/lib/server/startup";
import { json } from "@/lib/server/http";

export const GET: APIRoute = async () => {
    await ensureAppReady();
    return json({ ok: true, service: "ai-chibi-generator" });
};
