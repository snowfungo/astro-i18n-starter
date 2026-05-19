export type Locale = "en" | "zh" | "ja" | "es" | "fr";
export type PlanId = "free" | "starter" | "standard" | "value";
export type ChibiStyle = "classic" | "kawaii" | "avatar" | "emoji";
export type SourceType = "text" | "image";

export const defaultLocale: Locale = "en";
export const supportedLocales: Locale[] = ["en", "zh", "ja", "es", "fr"];

export const planConfig: Record<
    PlanId,
    {
        id: PlanId;
        name: string;
        credits: number;
        price: number;
        description: string;
        stripeLookupKey?: string;
        stripeUnitAmount?: number;
        currency?: string;
    }
> = {
    free: {
        id: "free",
        name: "Free",
        credits: 6,
        price: 0,
        description: "6 signup credits, no purchase required",
    },
    starter: {
        id: "starter",
        name: "Starter Pack",
        credits: 50,
        price: 4.99,
        description: "50 credits (~16 text or 6 photo generations)",
        stripeLookupKey: "chibi_starter_pack",
        stripeUnitAmount: 499,
        currency: "usd",
    },
    standard: {
        id: "standard",
        name: "Standard Pack",
        credits: 120,
        price: 9.99,
        description: "120 credits (~40 text or 15 photo generations)",
        stripeLookupKey: "chibi_standard_pack",
        stripeUnitAmount: 999,
        currency: "usd",
    },
    value: {
        id: "value",
        name: "Value Pack",
        credits: 280,
        price: 19.99,
        description: "280 credits (~93 text or 35 photo generations)",
        stripeLookupKey: "chibi_value_pack",
        stripeUnitAmount: 1999,
        currency: "usd",
    },
};

export const stylePrompts: Record<ChibiStyle, string> = {
    classic: "classic cute chibi character, big head, tiny body, expressive eyes",
    kawaii: "kawaii pastel chibi character, soft colors, adorable anime style",
    avatar: "clean chibi profile avatar, centered composition, simple background",
    emoji: "expressive chibi sticker, bold outline, transparent-feeling simple background",
};

export const styleLabels: Record<ChibiStyle, string> = {
    classic: "Classic Chibi",
    kawaii: "Kawaii Soft",
    avatar: "Portrait Chibi",
    emoji: "Emoji & Sticker",
};

export const creditCostBySourceType: Record<SourceType, number> = {
    text: 3,
    image: 8,
};

export const signupBonusCredits = 6;

export const seoConfig = {
    siteName: "AI Chibi Generator",
    siteDescription:
        "Create adorable chibi characters from text prompts or photos. Free AI chibi maker with classic, kawaii, avatar, and emoji sticker styles.",
};

export function getPlan(planId: PlanId) {
    return planConfig[planId];
}

export function getGenerationCost(sourceType: SourceType): number {
    return creditCostBySourceType[sourceType];
}
