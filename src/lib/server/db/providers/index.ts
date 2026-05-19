import { serverEnv } from "@/lib/server/config/env";
import { d1Provider } from "@/lib/server/db/providers/d1";
import { mysqlProvider } from "@/lib/server/db/providers/mysql";
import { postgresProvider } from "@/lib/server/db/providers/postgres";
import { sqliteProvider } from "@/lib/server/db/providers/sqlite";

export type DbProviderName = "postgres" | "sqlite" | "d1" | "mysql";

function resolveProviderName(): DbProviderName {
    const provider = serverEnv.databaseProvider;
    if (["postgres", "sqlite", "d1", "mysql"].includes(provider)) {
        return provider as DbProviderName;
    }
    return serverEnv.databaseUrl ? "postgres" : "postgres";
}

export function getDbProvider() {
    const providerName = resolveProviderName();
    switch (providerName) {
        case "postgres":
            if (!serverEnv.databaseUrl) {
                throw new Error("DATABASE_URL is required for PostgreSQL mode");
            }
            return postgresProvider;
        case "sqlite":
            return sqliteProvider.unavailable();
        case "d1":
            return d1Provider.unavailable();
        case "mysql":
            return mysqlProvider.unavailable();
        default:
            throw new Error(`Database provider not implemented: ${providerName}`);
    }
}

export function getDbCapabilities() {
    return getDbProvider().capabilities;
}
