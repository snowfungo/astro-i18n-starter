const localeModules = import.meta.glob("/src/data/chibi-i18n/**/*.json", {
    eager: true,
});

export const languages = {
    en: "English",
    zh: "中文",
    ja: "日本語",
    es: "Español",
    fr: "Français",
} as const;

export type AppLanguage = keyof typeof languages;
export const defaultLang: AppLanguage = "en";
export const showDefaultLang = false;

type TranslationTree = Record<string, unknown>;

function setNestedValue(target: TranslationTree, path: string[], value: unknown) {
    let cursor = target;
    for (const segment of path.slice(0, -1)) {
        if (!cursor[segment] || typeof cursor[segment] !== "object") {
            cursor[segment] = {};
        }
        cursor = cursor[segment] as TranslationTree;
    }
    cursor[path[path.length - 1]] = value;
}

function expandFlatKeys(input: unknown) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return input;
    }

    const result: TranslationTree = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        if (key.includes(".")) {
            setNestedValue(result, key.split("."), expandFlatKeys(value));
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
            result[key] = expandFlatKeys(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

function normalizePageTranslations(pageName: string, input: unknown) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return input;
    }

    const result: TranslationTree = {};
    const prefix = `${pageName}.`;
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        const nextKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
        if (nextKey.includes(".")) {
            setNestedValue(result, nextKey.split("."), expandFlatKeys(value));
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
            result[nextKey] = expandFlatKeys(value);
        } else {
            result[nextKey] = value;
        }
    }
    return result;
}

export const ui = Object.entries(localeModules).reduce(
    (acc, [path, module]) => {
        const loaded = (module as { default?: unknown }).default ?? module;
        const normalized = path.replace("/src/data/chibi-i18n/", "");

        if (normalized.startsWith("common.")) {
            const lang = normalized.split(".")[1] as AppLanguage;
            acc[lang] ??= {};
            acc[lang].common = expandFlatKeys(loaded) as TranslationTree;
            return acc;
        }

        if (normalized.startsWith("pages/")) {
            const fileName = normalized.replace("pages/", "");
            const match = fileName.match(/^(.*)\.([a-z]{2})\.json$/);
            if (!match) {
                return acc;
            }
            const [, pageName, lang] = match;
            acc[lang as AppLanguage] ??= {};
            acc[lang as AppLanguage].pages ??= {};
            setNestedValue(
                acc[lang as AppLanguage].pages as TranslationTree,
                [pageName],
                normalizePageTranslations(pageName, loaded),
            );
        }

        return acc;
    },
    {} as Record<AppLanguage, Record<string, unknown>>,
);

export type TranslationKey = string;
