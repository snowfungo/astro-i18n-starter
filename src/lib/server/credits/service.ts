import { getGenerationCost, signupBonusCredits, type SourceType } from "@/lib/server/config/app";
import { all, get, run, transaction } from "@/lib/server/db/client";
import { nowIso, stringifyJson } from "@/lib/server/db/utils";

export async function expireCredits(userId: number) {
  const rows = await all<{ id: number; amount: number }>(
    `SELECT id, amount FROM user_credits WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at < ?`,
    [userId, nowIso()],
  );

  for (const row of rows) {
    const balance = await getAvailableCredits(userId) - row.amount;
    await run(
      `INSERT INTO credit_transactions (user_id, amount, balance_after, type, details)
       VALUES (?, ?, ?, 'expire', ?)`,
      [userId, -row.amount, Math.max(0, balance), `credit_id=${row.id}`],
    );
    await run(`DELETE FROM user_credits WHERE id = ?`, [row.id]);
  }
}

export async function getAvailableCredits(userId: number) {
  await expireCredits(userId);
  const row = await get<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM user_credits WHERE user_id = ?`,
    [userId],
  );
  return Number(row?.total ?? 0);
}

export async function addCredits(input: {
  userId: number;
  amount: number;
  source: string;
  expiresAt?: string | null;
  details?: Record<string, unknown>;
}) {
  if (input.amount <= 0) {
    throw new Error("Amount must be positive");
  }

  await transaction(async () => {
    await run(
      `INSERT INTO user_credits (user_id, amount, source, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [input.userId, input.amount, input.source, input.expiresAt ?? null, nowIso()],
    );

    const balance = await getAvailableCredits(input.userId);
    await run(
      `INSERT INTO credit_transactions (user_id, amount, balance_after, type, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.userId,
        input.amount,
        balance,
        input.source,
        input.details ? stringifyJson(input.details) : null,
      ],
    );
  });

  return { success: true, balance: await getAvailableCredits(input.userId) };
}

export async function refundCredits(userId: number, amount: number, details?: Record<string, unknown>) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return await addCredits({
    userId,
    amount,
    source: "refund",
    expiresAt,
    details,
  });
}

export async function deductCredits(
  userId: number,
  amount: number,
  details?: Record<string, unknown>,
  transactionType = "generate",
) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  return await transaction(async () => {
    await expireCredits(userId);
    const available = await getAvailableCredits(userId);
    if (available < amount) {
      return { success: false, available, required: amount };
    }

    const rows = await all<{ id: number; amount: number; expires_at: string | null }>(
      `SELECT id, amount, expires_at FROM user_credits
       WHERE user_id = ? AND amount > 0
       ORDER BY CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END, expires_at ASC, id ASC`,
      [userId],
    );

    let remaining = amount;
    for (const row of rows) {
      if (remaining <= 0) {
        break;
      }
      const used = Math.min(row.amount, remaining);
      const nextAmount = row.amount - used;
      if (nextAmount > 0) {
        await run(`UPDATE user_credits SET amount = ? WHERE id = ?`, [nextAmount, row.id]);
      } else {
        await run(`DELETE FROM user_credits WHERE id = ?`, [row.id]);
      }
      remaining -= used;
    }

    const balanceAfter = available - amount;
    await run(
      `INSERT INTO credit_transactions (user_id, amount, balance_after, type, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, -amount, balanceAfter, transactionType, details ? stringifyJson(details) : null],
    );
    return { success: true, remaining: balanceAfter };
  });
}

export async function getCreditsSummary(userId: number) {
  await expireCredits(userId);
  const available = await getAvailableCredits(userId);
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const expiringSoonRow = await get<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM user_credits
     WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at <= ?`,
    [userId, soon],
  );
  const nextExpiryRow = await get<{ next_expiry: string | null }>(
    `SELECT MIN(expires_at) as next_expiry FROM user_credits
     WHERE user_id = ? AND expires_at IS NOT NULL AND amount > 0`,
    [userId],
  );

  return {
    available,
    expiring_soon: Number(expiringSoonRow?.total ?? 0),
    expiring_at: nextExpiryRow?.next_expiry ?? null,
  };
}

export async function getCreditHistory(userId: number, limit = 50) {
  return await all(
    `SELECT id, amount, balance_after, type, details, created_at
     FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, Math.max(1, Math.min(limit, 200))],
  );
}

export async function ensureSignupCredits(userId: number) {
  const row = await get<{ id: number }>(
    `SELECT id FROM user_credits WHERE user_id = ? AND source = 'signup' LIMIT 1`,
    [userId],
  );
  if (row) {
    return false;
  }
  await addCredits({
    userId,
    amount: signupBonusCredits,
    source: "signup",
    expiresAt: null,
    details: { reason: "signup_bonus" },
  });
  return true;
}

export function getCostForSourceType(sourceType: SourceType) {
  return getGenerationCost(sourceType);
}
