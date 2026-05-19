import { serverEnv } from "@/lib/server/config/env";
import { postgresProvider } from "@/lib/server/db/providers/postgres";

export type DbProviderName = "postgres" | "sqlite" | "d1" | "mysql";

function resolveProviderName(): DbProviderName {
    if (serverEnv.databaseUrl) {
        return "postgres";
    }
    return "postgres";
}

export function getDbProvider() {
    const providerName = resolveProviderName();
    switch (providerName) {
        case "postgres":
            if (!serverEnv.databaseUrl) {
                throw new Error("DATABASE_URL is required for PostgreSQL mode");
            }
            return postgresProvider;
        default:
            throw new Error(`Database provider not implemented: ${providerName}`);
    }
}

export function getDbCapabilities() {
    return getDbProvider().capabilities;
}
