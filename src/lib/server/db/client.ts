import { AsyncLocalStorage } from "node:async_hooks";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { serverEnv } from "@/lib/server/config/env";
import { dbSchema } from "@/lib/server/db/schema";

if (!serverEnv.databaseUrl) {
  throw new Error("DATABASE_URL is required for PostgreSQL mode");
}

const sqlClient = postgres(serverEnv.databaseUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
});

const txStorage = new AsyncLocalStorage<Sql>();

function currentClient() {
  return txStorage.getStore() ?? sqlClient;
}

function toPgPlaceholders(query: string) {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
}

function normalizeRunResult(result: any) {
  const firstRow = Array.isArray(result) ? result[0] : null;
  const lastInsertRowid =
    firstRow && typeof firstRow === "object" && "id" in firstRow
      ? Number((firstRow as Record<string, unknown>).id)
      : null;

  return {
    changes: Number(result?.count ?? 0),
    lastInsertRowid,
  };
}

export const db = drizzle(sqlClient, { schema: dbSchema });

export function getSql() {
  return currentClient();
}

export async function run(
  query: string,
  params: unknown[] = [],
) {
  const result = await currentClient().unsafe(toPgPlaceholders(query), params as any[]);
  return normalizeRunResult(result) as {
    changes: number;
    lastInsertRowid: number | null;
  };
}

export async function get<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
) {
  const rows = await currentClient().unsafe(toPgPlaceholders(query), params as any[]);
  return ((rows as T[])[0] ?? null) as T | null;
}

export async function all<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
) {
  const rows = await currentClient().unsafe(toPgPlaceholders(query), params as any[]);
  return rows as T[];
}

export async function transaction<T>(fn: () => Promise<T> | T): Promise<T> {
  return currentClient().begin(async (tx) => txStorage.run(tx, () => Promise.resolve(fn())));
}

export async function closeDb() {
  await sqlClient.end({ timeout: 5 });
}
