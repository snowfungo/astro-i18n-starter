import { getDbProvider } from "@/lib/server/db/providers";

const provider = getDbProvider();

export const db = provider.orm;

export function getSql() {
    return provider.getSql();
}

export async function run(query: string, params: unknown[] = []) {
    return await provider.run(query, params);
}

export async function get<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
    return await provider.get<T>(query, params);
}

export async function all<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
    return await provider.all<T>(query, params);
}

export async function transaction<T>(fn: () => Promise<T> | T): Promise<T> {
    return await provider.transaction(fn);
}

export async function closeDb() {
    await provider.close();
}
