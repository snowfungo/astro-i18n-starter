import { createHash } from "node:crypto";

export function nowIso() {
    return new Date().toISOString();
}

export function toUnixSeconds(date: Date) {
    return Math.floor(date.getTime() / 1000);
}

export function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

export function stringifyJson(value: unknown) {
    return JSON.stringify(value, null, 0);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) {
        return fallback;
    }
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

export function sqlBool(value: boolean) {
    return value ? 1 : 0;
}

export function dbNumber(value: number | bigint) {
    return typeof value === "bigint" ? Number(value) : value;
}
