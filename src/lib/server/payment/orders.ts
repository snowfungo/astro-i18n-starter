import { all, run } from "@/lib/server/db/client";
import { nowIso } from "@/lib/server/db/utils";
import type { PlanId } from "@/lib/server/config/app";

export type PaymentOrderStatus = "pending" | "completed" | "failed";

export async function ensurePaymentOrderTable() {
    await run(`CREATE TABLE IF NOT EXISTS payment_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        provider_reference_id TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await run(`CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_payment_orders_reference_id ON payment_orders(provider_reference_id)`);
}

export async function createPaymentOrder(input: {
    userId: number;
    planId: PlanId;
    provider: string;
    amount: number;
    currency: string;
    metadataJson?: string | null;
}) {
    await ensurePaymentOrderTable();
    const result = await run(
        `INSERT INTO payment_orders (user_id, plan_id, provider, amount, currency, status, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
         RETURNING id`,
        [input.userId, input.planId, input.provider, input.amount, input.currency, input.metadataJson ?? null, nowIso(), nowIso()],
    );
    return Number(result.lastInsertRowid ?? 0);
}

export async function markPaymentOrder(input: {
    orderId?: number | null;
    providerReferenceId?: string | null;
    status: PaymentOrderStatus;
    metadataJson?: string | null;
}) {
    await ensurePaymentOrderTable();
    if (input.orderId) {
        await run(
            `UPDATE payment_orders
             SET status = ?, provider_reference_id = COALESCE(?, provider_reference_id), metadata_json = COALESCE(?, metadata_json), updated_at = ?
             WHERE id = ?`,
            [input.status, input.providerReferenceId ?? null, input.metadataJson ?? null, nowIso(), input.orderId],
        );
    }
}

export async function listRecentPaymentOrders(userId: number) {
    await ensurePaymentOrderTable();
    return await all(
        `SELECT id, plan_id, provider, amount, currency, status, provider_reference_id, created_at, updated_at
         FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
        [userId],
    );
}
