import { all, get, run, transaction } from "@/lib/server/db/client";

export async function exportAccountData(userId: number) {
  const profile = await get(
    `SELECT id, google_id, email, name, avatar_url, created_at FROM users WHERE id = ?`,
    [userId],
  );
  const subscription = await get(
    `SELECT plan, status, stripe_customer_id, stripe_subscription_id,
            current_period_start, current_period_end, cancel_at_period_end
     FROM subscriptions WHERE user_id = ?`,
    [userId],
  );
  const images = await all(
    `SELECT id, status, prompt, final_prompt, style, source_type, input_filename,
            input_size_bytes, model_provider, model, output_url, error, latency_ms,
            created_at, started_at, completed_at
     FROM image_generations WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  const payments = await all(
    `SELECT id, amount, provider, created_at FROM payment_logs WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  const paymentOrders = await all(
    `SELECT id, plan_id, provider, amount, currency, status, provider_reference_id, created_at, updated_at
     FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  const credits = await all(
    `SELECT id, amount, balance_after, type, details, created_at
     FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );

  return { profile, subscription, images, payments, paymentOrders, credits };
}

export async function deleteAccountData(userId: number) {
  await transaction(async () => {
    await run(`DELETE FROM credit_transactions WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM user_credits WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM payment_orders WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM payment_logs WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM image_generations WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM subscriptions WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM refresh_tokens WHERE user_id = ?`, [userId]);
    await run(`DELETE FROM users WHERE id = ?`, [userId]);
  });
}
