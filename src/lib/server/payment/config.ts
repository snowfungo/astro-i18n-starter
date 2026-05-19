import { getPlan, planConfig, type PlanId } from "@/lib/server/config/app";

export function isPaidPlan(planId: PlanId) {
    const plan = getPlan(planId);
    return Boolean(plan && plan.price > 0);
}

export function listPaidPlans() {
    return (Object.keys(planConfig) as PlanId[]).filter((planId) => isPaidPlan(planId));
}

export function resolveCheckoutPlan(planId: PlanId) {
    const plan = getPlan(planId);
    if (!plan || plan.price <= 0) {
        throw new Error("Invalid paid plan");
    }
    return plan;
}
