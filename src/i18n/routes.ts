export const defaultLang = "en";
export const showDefaultLang = false;

export const languageNames = {
    en: "English",
    zh: "中文",
    ja: "日本語",
    es: "Español",
    fr: "Français",
} as const;

export type AppLang = keyof typeof languageNames;

export const routes: Record<AppLang, Record<string, string>> = {
    en: {
        home: "",
        "photo-to-chibi": "photo-to-chibi",
        "chibi-avatar-maker": "chibi-avatar-maker",
        "chibi-couple-generator": "chibi-couple-generator",
        pricing: "pricing",
        features: "features",
        about: "about",
        dashboard: "dashboard",
        admin: "admin",
        blog: "blog",
    },
    zh: {
        home: "zh",
        "photo-to-chibi": "zh/zhopian-zhuan-qban",
        "chibi-avatar-maker": "zh/qban-touxiang-zhizuoqi",
        "chibi-couple-generator": "zh/qban-qinglu-shengchengqi",
        pricing: "zh/dingjia",
        features: "zh/gongneng",
        about: "zh/guanyu",
        dashboard: "zh/zhanghu",
        admin: "zh/admin",
        blog: "zh/blog",
    },
    ja: {
        home: "ja",
        "photo-to-chibi": "ja/photo-to-chibi",
        "chibi-avatar-maker": "ja/chibi-avatar-maker",
        "chibi-couple-generator": "ja/chibi-couple-generator",
        pricing: "ja/pricing",
        features: "ja/features",
        about: "ja/about",
        dashboard: "ja/dashboard",
        admin: "ja/admin",
        blog: "ja/blog",
    },
    es: {
        home: "es",
        "photo-to-chibi": "es/foto-a-chibi",
        "chibi-avatar-maker": "es/creador-de-avatar-chibi",
        "chibi-couple-generator": "es/generador-de-pareja-chibi",
        pricing: "es/precios",
        features: "es/funciones",
        about: "es/acerca-de",
        dashboard: "es/panel",
        admin: "es/admin",
        blog: "es/blog",
    },
    fr: {
        home: "fr",
        "photo-to-chibi": "fr/photo-en-chibi",
        "chibi-avatar-maker": "fr/createur-avatar-chibi",
        "chibi-couple-generator": "fr/generateur-couple-chibi",
        pricing: "fr/tarifs",
        features: "fr/fonctionnalites",
        about: "fr/a-propos",
        dashboard: "fr/tableau-de-bord",
        admin: "fr/admin",
        blog: "fr/blog",
    },
};

export const localizedPathToRoute = Object.entries(routes).reduce(
    (acc, [lang, items]) => {
        for (const [routeKey, localized] of Object.entries(items)) {
            if (!localized) {
                continue;
            }
            acc[localized.replace(/^\//, "")] = { lang: lang as AppLang, routeKey };
        }
        return acc;
    },
    {} as Record<string, { lang: AppLang; routeKey: string }>,
);
