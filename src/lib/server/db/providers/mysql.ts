export const mysqlProvider = {
    name: "mysql" as const,
    capabilities: {
        returning: false,
        transactions: true,
    },
    unavailable() {
        throw new Error("MySQL provider is planned but not implemented yet");
    },
};
