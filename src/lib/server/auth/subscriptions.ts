import { get, run } from "@/lib/server/db/client";
import { nowIso } from "@/lib/server/db/utils";

export type SubscriptionRecord = {
  id: number;
  user_id: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_item_id: string | null;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
};

export async function getSubscriptionByUserId(userId: number) {
  return await get<SubscriptionRecord>(
    `SELECT id, user_id, stripe_customer_id, stripe_subscription_id, stripe_subscription_item_id,
            plan, status, current_period_start, current_period_end, cancel_at_period_end
     FROM subscriptions WHERE user_id = ?`,
    [userId],
  );
}

export async function ensureSubscription(userId: number, plan = "free", status = "active") {
  const existing = await getSubscriptionByUserId(userId);
  if (existing) {
    return existing;
  }
  await run(
    `INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, plan, status, nowIso(), nowIso()],
  );
  return (await getSubscriptionByUserId(userId))!;
}

export async function updateSubscription(userId: number, input: Partial<SubscriptionRecord>) {
  const existing = await ensureSubscription(userId);
  await run(
    `UPDATE subscriptions
     SET stripe_customer_id = ?, stripe_subscription_id = ?, stripe_subscription_item_id = ?,
         plan = ?, status = ?, current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?
     WHERE user_id = ?`,
    [
      input.stripe_customer_id ?? existing.stripe_customer_id,
      input.stripe_subscription_id ?? existing.stripe_subscription_id,
      input.stripe_subscription_item_id ?? existing.stripe_subscription_item_id,
      input.plan ?? existing.plan,
      input.status ?? existing.status,
      input.current_period_start ?? existing.current_period_start,
      input.current_period_end ?? existing.current_period_end,
      input.cancel_at_period_end ?? existing.cancel_at_period_end,
      userId,
    ],
  );
  return (await getSubscriptionByUserId(userId))!;
}
