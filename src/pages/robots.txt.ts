import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
    const productionDomain = import.meta.env.PRODUCTION_DOMAIN as string | undefined;
    const isProd = productionDomain && url.origin === productionDomain;
    const body = isProd
        ? `User-agent: *\nAllow: /\nSitemap: ${productionDomain}/sitemap-index.xml\n`
        : "User-agent: *\nDisallow: /\n";

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
};
