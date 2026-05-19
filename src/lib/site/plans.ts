import { planConfig } from "@/lib/server/config/app";

export const pricingCards = [
    {
        id: "free",
        titleKey: "pricing.free_title",
        descKey: "pricing.free_desc",
        ctaKey: "pricing.free_btn",
        creditKey: "pricing.free_credit",
        featureKeys: ["pricing.free_feature1", "pricing.free_feature2"],
        priceLabel: "$0",
        paid: false,
    },
    {
        id: "starter",
        titleKey: "pricing.starter_title",
        descKey: "pricing.starter_desc",
        ctaKey: "pricing.buy_btn",
        creditLabel: `${planConfig.starter.credits} credits`,
        priceLabel: `$${planConfig.starter.price}`,
        paid: true,
    },
    {
        id: "standard",
        titleKey: "pricing.standard_title",
        descKey: "pricing.standard_desc",
        ctaKey: "pricing.buy_btn",
        creditLabel: `${planConfig.standard.credits} credits`,
        priceLabel: `$${planConfig.standard.price}`,
        paid: true,
        featured: true,
    },
    {
        id: "value",
        titleKey: "pricing.value_title",
        descKey: "pricing.value_desc",
        ctaKey: "pricing.buy_btn",
        creditLabel: `${planConfig.value.credits} credits`,
        priceLabel: `$${planConfig.value.price}`,
        paid: true,
    },
];
