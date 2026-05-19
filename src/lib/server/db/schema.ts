import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const schemaVersion = pgTable("schema_version", {
  version: integer("version").primaryKey(),
  description: text("description"),
  appliedAt: text("applied_at").default("CURRENT_TIMESTAMP"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id"),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("user"),
  isMockUser: integer("is_mock_user").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  googleIdIdx: uniqueIndex("users_google_id_key").on(table.googleId),
  emailIdx: uniqueIndex("users_email_key").on(table.email),
}));

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  revoked: integer("revoked").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  tokenHashIdx: uniqueIndex("refresh_tokens_token_hash_key").on(table.tokenHash),
  userIdx: index("idx_refresh_tokens_user_id").on(table.userId),
  expiresIdx: index("idx_refresh_tokens_expires").on(table.expiresAt),
}));

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionItemId: text("stripe_subscription_item_id"),
  plan: text("plan").default("free"),
  status: text("status").default("active"),
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0),
}, (table) => ({
  userIdx: uniqueIndex("subscriptions_user_id_key").on(table.userId),
  userLookupIdx: index("idx_subscriptions_user_id").on(table.userId),
  customerLookupIdx: index("idx_subscriptions_customer_id").on(table.stripeCustomerId),
}));

export const imageGenerations = pgTable("image_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  status: text("status").default("pending"),
  prompt: text("prompt"),
  finalPrompt: text("final_prompt"),
  style: text("style").default("classic"),
  sourceType: text("source_type").default("text"),
  inputFilename: text("input_filename"),
  inputSizeBytes: integer("input_size_bytes"),
  inputContentType: text("input_content_type"),
  modelProvider: text("model_provider").default("mock"),
  model: text("model"),
  providerTaskId: text("provider_task_id"),
  remoteUrl: text("remote_url"),
  archivePath: text("archive_path"),
  providerRawJson: text("provider_raw_json"),
  outputUrl: text("output_url"),
  error: text("error"),
  latencyMs: integer("latency_ms"),
  creditsCost: integer("credits_cost").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
}, (table) => ({
  userIdx: index("idx_image_generations_user_id").on(table.userId),
  sessionIdx: index("idx_image_generations_session_id").on(table.sessionId),
  createdIdx: index("idx_image_generations_created_at").on(table.createdAt),
}));

export const anonymousImageUsage = pgTable("anonymous_image_usage", {
  id: serial("id").primaryKey(),
  usageDate: varchar("usage_date", { length: 10 }).notNull(),
  ipHash: text("ip_hash").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  firstSeenAt: text("first_seen_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
}, (table) => ({
  uniqueUsage: uniqueIndex("anonymous_image_usage_usage_date_ip_hash_key").on(table.usageDate, table.ipHash),
  dateIdx: index("idx_anonymous_image_usage_date").on(table.usageDate),
}));

export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull().default(0),
  source: text("source").notNull().default("purchase"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdx: index("idx_user_credits_user_id").on(table.userId),
}));

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  type: text("type").notNull(),
  details: text("details"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdx: index("idx_credit_transactions_user_id").on(table.userId),
}));

export const paymentLogs = pgTable("payment_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  amount: text("amount"),
  provider: text("provider"),
  referenceId: text("reference_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdx: index("idx_payment_logs_user_id").on(table.userId),
}));

export const paymentOrders = pgTable("payment_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: text("plan_id").notNull(),
  provider: text("provider").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("pending"),
  providerReferenceId: text("provider_reference_id"),
  metadataJson: text("metadata_json"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdx: index("idx_payment_orders_user_id").on(table.userId),
  providerReferenceIdx: index("idx_payment_orders_reference_id").on(table.providerReferenceId),
}));

export const processedWebhooks = pgTable("processed_webhooks", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type"),
  processedAt: text("processed_at").default("CURRENT_TIMESTAMP"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
}, (table) => ({
  userIdx: index("idx_audit_logs_user_id").on(table.userId),
}));

export const dbSchema = {
  schemaVersion,
  users,
  refreshTokens,
  subscriptions,
  imageGenerations,
  anonymousImageUsage,
  userCredits,
  creditTransactions,
  paymentLogs,
  paymentOrders,
  processedWebhooks,
  auditLogs,
};
