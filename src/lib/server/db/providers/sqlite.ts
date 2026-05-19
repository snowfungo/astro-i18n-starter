export const sqliteProvider = {
    name: "sqlite" as const,
    capabilities: {
        returning: false,
        transactions: true,
    },
    unavailable() {
        throw new Error("SQLite provider is planned but not implemented in this deployment target");
    },
};
