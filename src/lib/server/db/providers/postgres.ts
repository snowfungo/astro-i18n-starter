import { AsyncLocalStorage } from "node:async_hooks";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { serverEnv } from "@/lib/server/config/env";
import { dbSchema } from "@/lib/server/db/schema";

const txStorage = new AsyncLocalStorage<Sql>();

function createClient() {
    return postgres(serverEnv.databaseUrl, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 15,
        prepare: false,
        onnotice: () => {},
    });
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

const sharedClient = createClient();

async function withClient<T>(fn: (client: Sql) => Promise<T>) {
    const txClient = txStorage.getStore();
    if (txClient) {
        return await fn(txClient);
    }

    const client = createClient();
    try {
        return await fn(client);
    } finally {
        await client.end({ timeout: 5 });
    }
}

export const postgresProvider = {
    name: "postgres" as const,
    capabilities: {
        returning: true,
        transactions: true,
    },
    orm: drizzle(sharedClient, { schema: dbSchema }),
    getSql() {
        return txStorage.getStore() ?? sharedClient;
    },
    async run(query: string, params: unknown[] = []) {
        const result = await withClient((client) => client.unsafe(toPgPlaceholders(query), params as any[]));
        return normalizeRunResult(result) as { changes: number; lastInsertRowid: number | null };
    },
    async get<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
        const rows = await withClient((client) => client.unsafe(toPgPlaceholders(query), params as any[]));
        return ((rows as T[])[0] ?? null) as T | null;
    },
    async all<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
        const rows = await withClient((client) => client.unsafe(toPgPlaceholders(query), params as any[]));
        return rows as T[];
    },
    async transaction<T>(fn: () => Promise<T> | T) {
        const client = createClient();
        try {
            return await client.begin(async (tx) => txStorage.run(tx, () => Promise.resolve(fn())));
        } finally {
            await client.end({ timeout: 5 });
        }
    },
    async close() {
        await sharedClient.end({ timeout: 5 });
    },
};

export type PostgresProvider = typeof postgresProvider;
