export const d1Provider = {
    name: "d1" as const,
    capabilities: {
        returning: false,
        transactions: true,
    },
    unavailable() {
        throw new Error("Cloudflare D1 provider is planned but not implemented yet");
    },
};
