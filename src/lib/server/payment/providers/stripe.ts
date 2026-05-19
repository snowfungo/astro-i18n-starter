import Stripe from "stripe";

import { serverEnv } from "@/lib/server/config/env";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
    if (!serverEnv.stripeSecretKey) {
        return null;
    }
    stripeClient ??= new Stripe(serverEnv.stripeSecretKey, {
        apiVersion: "2025-09-30.clover",
    });
    return stripeClient;
}

export function isStripeAvailable() {
    return Boolean(getStripeClient());
}
