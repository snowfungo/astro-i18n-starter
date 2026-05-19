import { all, run } from "@/lib/server/db/client";

const MIGRATIONS: Array<{ version: number; description: string; statements: string[] }> = [
  {
    version: 1,
    description: "initial schema",
    statements: [
      `CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'user',
        is_mock_user INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        revoked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)`,
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        stripe_subscription_item_id TEXT,
        plan TEXT DEFAULT 'free',
        status TEXT DEFAULT 'active',
        current_period_start TEXT,
        current_period_end TEXT,
        cancel_at_period_end INTEGER DEFAULT 0
      )`,
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(stripe_customer_id)`,
      `CREATE TABLE IF NOT EXISTS image_generations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        session_id TEXT,
        status TEXT DEFAULT 'pending',
        prompt TEXT,
        final_prompt TEXT,
        style TEXT DEFAULT 'classic',
        source_type TEXT DEFAULT 'text',
        input_filename TEXT,
        input_size_bytes INTEGER,
        input_content_type TEXT,
        model_provider TEXT DEFAULT 'mock',
        model TEXT,
        provider_task_id TEXT,
        remote_url TEXT,
        archive_path TEXT,
        provider_raw_json TEXT,
        output_url TEXT,
        error TEXT,
        latency_ms INTEGER,
        credits_cost INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        started_at TEXT,
        completed_at TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON image_generations(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_image_generations_session_id ON image_generations(session_id)`,
      `CREATE INDEX IF NOT EXISTS idx_image_generations_created_at ON image_generations(created_at)`,
      `CREATE TABLE IF NOT EXISTS anonymous_image_usage (
        id SERIAL PRIMARY KEY,
        usage_date VARCHAR(10) NOT NULL,
        ip_hash TEXT NOT NULL,
        used_count INTEGER NOT NULL DEFAULT 0,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        UNIQUE (usage_date, ip_hash)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_anonymous_image_usage_date ON anonymous_image_usage(usage_date)`,
      `CREATE TABLE IF NOT EXISTS user_credits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'purchase',
        expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)`,
      `CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        type TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id)`,
      `CREATE TABLE IF NOT EXISTS payment_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        amount TEXT,
        provider TEXT,
        reference_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id)`,
      `CREATE TABLE IF NOT EXISTS processed_webhooks (
        event_id TEXT PRIMARY KEY,
        event_type TEXT,
        processed_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`
    ],
  },
  {
    version: 2,
    description: "add payment orders",
    statements: [
      `CREATE TABLE IF NOT EXISTS payment_orders (
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
      )`,
      `CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payment_orders_reference_id ON payment_orders(provider_reference_id)`
    ],
  },
];

let migrated = false;

export async function migrateDb() {
  if (migrated) {
    return;
  }

  await run(`CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  const rows = await all<{ version: number | null }>(
    `SELECT MAX(version) AS version FROM schema_version`,
  );
  const currentVersion = Number(rows[0]?.version ?? 0);

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    for (const statement of migration.statements) {
      await run(statement);
    }

    await run(
      `INSERT INTO schema_version (version, description) VALUES ($1, $2)
       ON CONFLICT (version) DO NOTHING`,
      [migration.version, migration.description],
    );
  }

  migrated = true;
}
