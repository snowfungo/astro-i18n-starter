import type { APIContext } from "astro";

import { ensureSubscription } from "@/lib/server/auth/subscriptions";
import { deductCredits, ensureSignupCredits, getAvailableCredits, getCostForSourceType, refundCredits } from "@/lib/server/credits/service";
import { serverEnv } from "@/lib/server/config/env";
import { refundAnonymousQuota, reserveAnonymousQuota } from "@/lib/server/quota/service";
import type { SourceType } from "@/lib/server/config/app";

export async function reserveGenerationAllowance(input: {
    context: APIContext;
    session: { userId?: number | null };
    sourceType: SourceType;
}) {
    const cost = getCostForSourceType(input.sourceType);

    if (input.session.userId) {
        await ensureSubscription(input.session.userId);
        await ensureSignupCredits(input.session.userId);
        const available = await getAvailableCredits(input.session.userId);
        if (available < cost) {
            return {
                ok: false as const,
                cost,
                response: {
                    status: 429,
                    body: {
                        error: "Insufficient credits",
                        required: cost,
                        available,
                        source_type: input.sourceType,
                    },
                },
            };
        }
        const deducted = await deductCredits(input.session.userId, cost, {
            source_type: input.sourceType,
            action: "pre_deduct",
        });
        if (!deducted.success) {
            return {
                ok: false as const,
                cost,
                response: {
                    status: 429,
                    body: {
                        error: "Insufficient credits",
                        required: cost,
                        available: deducted.available,
                        source_type: input.sourceType,
                    },
                },
            };
        }
        return {
            ok: true as const,
            cost,
            creditsDeducted: true,
            quotaReserved: false,
        };
    }

    const quota = await reserveAnonymousQuota(input.context);
    if (!quota.allowed) {
        return {
            ok: false as const,
            cost,
            response: {
                status: 429,
                body: {
                    error: "Daily free image limit reached",
                    limit: quota.limit,
                    used: quota.used,
                    remaining: quota.remaining,
                    reset_at: quota.reset_at,
                },
            },
        };
    }
    return {
        ok: true as const,
        cost,
        creditsDeducted: false,
        quotaReserved: true,
    };
}

export async function rollbackGenerationAllowance(input: {
    context: APIContext;
    session: { userId?: number | null };
    sourceType: SourceType;
    cost: number;
    quotaReserved: boolean;
    creditsDeducted: boolean;
}) {
    if (input.quotaReserved && serverEnv.anonRefundOnProviderError) {
        await refundAnonymousQuota(input.context);
    }
    if (input.creditsDeducted && input.session.userId) {
        await refundCredits(input.session.userId, input.cost, {
            source_type: input.sourceType,
            reason: "provider_error",
        });
    }
}
