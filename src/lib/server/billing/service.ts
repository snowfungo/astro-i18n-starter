import Stripe from "stripe";

import { ensureSubscription, updateSubscription } from "@/lib/server/auth/subscriptions";
import { getUserById } from "@/lib/server/auth/users";
import { getPlan, planConfig, type PlanId } from "@/lib/server/config/app";
import { serverEnv } from "@/lib/server/config/env";
import { addCredits, deductCredits, getCreditsSummary } from "@/lib/server/credits/service";
import { all, get, run, transaction } from "@/lib/server/db/client";
import { nowIso } from "@/lib/server/db/utils";

let stripeClient: Stripe | null = null;

function getStripe() {
  if (!serverEnv.stripeSecretKey) {
    return null;
  }
  stripeClient ??= new Stripe(serverEnv.stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
  });
  return stripeClient;
}

export function isStripeEnabled() {
  return Boolean(getStripe());
}

async function recordPaymentLog(userId: number, amount: number, provider: string, referenceId?: string) {
  await run(
    `INSERT INTO payment_logs (user_id, amount, provider, reference_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, String(amount), provider, referenceId ?? null, nowIso()],
  );
}

async function markWebhookProcessed(eventId: string, eventType: string) {
  await run(
    `INSERT INTO processed_webhooks (event_id, event_type, processed_at)
     VALUES (?, ?, ?)
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, eventType, nowIso()],
  );
}

function getExpiryDate(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function createCheckoutSession(userId: number, planId: PlanId) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const plan = getPlan(planId);
  if (!plan || plan.price <= 0) {
    throw new Error("Invalid paid plan");
  }

  if (serverEnv.devStripeMock || !isStripeEnabled()) {
    await addCredits({
      userId,
      amount: plan.credits,
      source: "purchase",
      expiresAt: getExpiryDate(),
      details: { plan: planId, provider: "mock" },
    });
    await recordPaymentLog(userId, plan.price, "mock", `mock_${Date.now()}`);
    await updateSubscription(userId, {
      plan: planId,
      status: "active",
      current_period_start: nowIso(),
      current_period_end: getExpiryDate(),
    });
    return {
      url: "/dashboard?payment=success&mock=1",
      mock: true,
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is unavailable");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: plan.currency ?? "usd",
            unit_amount: plan.stripeUnitAmount,
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${serverEnv.appUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverEnv.appUrl}/pricing?payment=cancelled`,
      metadata: {
        user_id: String(userId),
        plan_id: planId,
        credits: String(plan.credits),
      },
    });

    return { url: session.url ?? "/dashboard" };
  } catch (error) {
    if (!serverEnv.allowMockFallback) {
      throw error;
    }
    await addCredits({
      userId,
      amount: plan.credits,
      source: "purchase",
      expiresAt: getExpiryDate(),
      details: { plan: planId, provider: "stripe_fallback" },
    });
    await recordPaymentLog(userId, plan.price, "stripe_fallback", `mock_${Date.now()}`);
    await updateSubscription(userId, {
      plan: planId,
      status: "active",
      current_period_start: nowIso(),
      current_period_end: getExpiryDate(),
    });
    return {
      url: "/dashboard?payment=success&mock=stripe_fallback",
      mock: true,
      fallback: true,
    };
  }
}

export async function createPortalSession(userId: number) {
  const subscription = await ensureSubscription(userId);
  if (serverEnv.devStripeMock || !isStripeEnabled()) {
    return { url: "/dashboard?portal=mock", mock: true };
  }
  if (!subscription.stripe_customer_id) {
    throw new Error("No Stripe customer found");
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is unavailable");
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${serverEnv.appUrl}/dashboard`,
    });
    return { url: session.url };
  } catch (error) {
    if (!serverEnv.allowMockFallback) {
      throw error;
    }
    return { url: "/dashboard?portal=mock&fallback=1", mock: true, fallback: true };
  }
}

export async function getSubscriptionState(userId: number) {
  const subscription = await ensureSubscription(userId);
  const summary = await getCreditsSummary(userId);
  return {
    plan: subscription.plan,
    status: subscription.status,
    credits: summary.available,
    expiring_soon: summary.expiring_soon,
    expiring_at: summary.expiring_at,
    has_stripe_customer: Boolean(subscription.stripe_customer_id),
  };
}

export async function getUsageState(userId: number) {
  const summary = await getCreditsSummary(userId);
  return {
    credits: summary.available,
    expiring_soon: summary.expiring_soon,
    expiring_at: summary.expiring_at,
  };
}

export async function handleStripeWebhook(payload: string, signature: string) {
  const stripe = getStripe();
  if (!stripe || !serverEnv.stripeWebhookSecret) {
    return { received: true, skipped: true };
  }

  const event = await stripe.webhooks.constructEventAsync(
    payload,
    signature,
    serverEnv.stripeWebhookSecret,
  );

  const processed = await get<{ event_id: string }>(
    `SELECT event_id FROM processed_webhooks WHERE event_id = ?`,
    [event.id],
  );
  if (processed) {
    return { received: true, duplicate: true };
  }

  await transaction(async () => {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = Number(session.metadata?.user_id ?? 0);
        const planId = (session.metadata?.plan_id ?? "free") as PlanId;
        const credits = Number(session.metadata?.credits ?? 0);
        if (userId > 0 && credits > 0) {
          await addCredits({
            userId,
            amount: credits,
            source: "purchase",
            expiresAt: getExpiryDate(),
            details: { plan: planId, provider: "stripe", session_id: session.id },
          });
          await recordPaymentLog(userId, (session.amount_total ?? 0) / 100, "stripe", session.id);
          await updateSubscription(userId, {
            plan: planId,
            status: "active",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            current_period_start: nowIso(),
            current_period_end: getExpiryDate(),
          });
        }
        break;
      }
      default:
        break;
    }

    await markWebhookProcessed(event.id, event.type);
  });

  return { received: true };
}

export async function listAdminUsers() {
  return await all(
    `SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.created_at,
            s.plan, s.status,
            COALESCE((SELECT SUM(amount) FROM user_credits uc WHERE uc.user_id = u.id), 0) AS credits,
            COALESCE((SELECT COUNT(*) FROM image_generations ig WHERE ig.user_id = u.id AND ig.status = 'completed'), 0) AS total_images
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     ORDER BY u.created_at DESC`,
  );
}

export async function fillCreditsAdmin(userId: number, amount: number) {
  if (amount === 0) {
    throw new Error("Amount cannot be zero");
  }
  if (amount > 0) {
    return await addCredits({
      userId,
      amount,
      source: "admin_adjustment",
      expiresAt: null,
      details: { reason: "admin_adjustment" },
    });
  }

  const deduction = await deductCredits(
    userId,
    Math.abs(amount),
    { reason: "admin_adjustment_deduction" },
    "admin_adjustment",
  );
  if (!deduction.success) {
    throw new Error("Insufficient credits to deduct");
  }
  return { success: true, balance: deduction.remaining };
}

export async function setPlanAdmin(userId: number, plan: string) {
  if (!(plan in planConfig)) {
    throw new Error("Unsupported plan");
  }
  return await updateSubscription(userId, { plan, status: "active" });
}
