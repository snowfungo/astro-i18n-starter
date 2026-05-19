import { routes, type AppLang } from "@/i18n/routes";
import { getLangFromUrl, getRouteKeyFromUrl } from "@/i18n/utils";

export type AppRouteKey = keyof (typeof routes)["en"];

export function getLocalizedSegments(url: URL) {
    return url.pathname.replace(/^\//, "").replace(/\/$/, "").split("/").filter(Boolean);
}

export function getRoutedPage(url: URL) {
    const segments = getLocalizedSegments(url);
    const isApi = segments[0] === "api";
    const lang = isApi ? "en" : getLangFromUrl(url);
    const routeKey = isApi ? "home" : (getRouteKeyFromUrl(url) as AppRouteKey);
    const homeSegment = routes[lang].home;
    const homePrefix = homeSegment ? homeSegment.split("/") : [];
    const routePrefix = routes[lang][routeKey]?.split("/") ?? [];

    let rest = segments;
    if (!isApi) {
        if (routeKey === "home") {
            rest = segments.slice(homePrefix.length);
        } else {
            rest = segments.slice(routePrefix.length);
        }
    }

    return {
        lang,
        routeKey,
        rest,
        isApi,
        isBlogDetail: !isApi && routeKey === "blog" && rest.length > 0,
    };
}

export function getPathForRoute(lang: AppLang, routeKey: AppRouteKey, tail: string[] = []) {
    const localized = routes[lang][routeKey];
    const base = localized ? `/${localized}` : "/";
    if (!tail.length) {
        return base;
    }
    return `${base.replace(/\/$/, "")}/${tail.join("/")}`;
}
