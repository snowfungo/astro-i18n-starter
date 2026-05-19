import { getCollection } from "astro:content";

import {
    defaultLang,
    localizedPathToRoute,
    routes,
    type AppLang,
} from "@i18n/routes";
import { type TranslationKey, ui } from "@i18n/ui";

function getNestedValue(obj: unknown, path: string): any {
    return path.split(".").reduce((current: any, key) => current?.[key], obj as any);
}

export function getLangFromUrl(url: URL): AppLang {
    const [, maybeLang] = url.pathname.split("/");
    if (maybeLang && maybeLang in routes && maybeLang !== defaultLang) {
        return maybeLang as AppLang;
    }

    const normalized = url.pathname.replace(/^\//, "").replace(/\/$/, "");
    const matched = localizedPathToRoute[normalized];
    if (matched) {
        return matched.lang;
    }

    return defaultLang;
}

export function getRouteKeyFromUrl(url: URL): string {
    const lang = getLangFromUrl(url);
    const pathname = url.pathname.replace(/^\//, "").replace(/\/$/, "");

    if (!pathname || pathname === lang) {
        return "home";
    }

    const matched = localizedPathToRoute[pathname];
    if (matched) {
        return matched.routeKey;
    }

    if (lang === defaultLang) {
        return pathname.split("/")[0];
    }

    const withoutLang = pathname.startsWith(`${lang}/`)
        ? pathname.slice(lang.length + 1)
        : pathname;
    return withoutLang.split("/")[0] || "home";
}

export function useTranslations(lang: AppLang) {
    return function t(key: TranslationKey, params?: Record<string, string | number>) {
        const [namespace, translationKey] = key.includes(":")
            ? key.split(":")
            : ["common", key];

        const translation =
            getNestedValue(ui[lang]?.[namespace], translationKey) ??
            getNestedValue(ui[defaultLang]?.[namespace], translationKey) ??
            key;

        if (params && typeof translation === "string") {
            return Object.entries(params).reduce(
                (result, [paramKey, value]) =>
                    result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value)),
                translation,
            );
        }

        return translation;
    };
}

export function useTranslatedPath(lang: AppLang) {
    return function translatePath(path: string, targetLang: AppLang = lang) {
        const normalized = path.replace(/^\//, "").replace(/\/$/, "");
        const routeKey = normalized || "home";
        const localized = routes[targetLang][routeKey] ?? routeKey;
        return localized ? `/${localized}` : "/";
    };
}

export async function switchLanguageUrl(currentUrl: URL, targetLang: AppLang) {
    const routeKey = getRouteKeyFromUrl(currentUrl);
    const translated = routes[targetLang][routeKey] ?? routeKey;

    if (routeKey === "blog") {
        const slug = currentUrl.pathname.split("/").filter(Boolean).at(-1);
        if (slug && slug !== translated) {
            return translated ? `/${translated}/${slug}` : `/${slug}`;
        }
    }

    return translated ? `/${translated}` : "/";
}

export async function buildContentLinks(): Promise<Record<string, Record<string, string>>> {
    const allPosts = await getCollection("blog", (entry) => !entry.data.isDraft);
    const links: Record<string, Record<string, string>> = {};

    for (const post of allPosts) {
        const { linkedContent } = post.data;
        if (!linkedContent) {
            continue;
        }
        const [lang] = post.id.split("/");
        links[linkedContent] ??= {};
        links[linkedContent][lang] = post.id;
    }

    return links;
}
