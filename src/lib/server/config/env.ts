import { env } from "node:process";

function toInt(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
    if (value == null || value === "") {
        return fallback;
    }
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const serverEnv = {
    appEnv: env.APP_ENV ?? "development",
    appUrl: env.APP_URL ?? env.PRODUCTION_DOMAIN ?? "http://localhost:4321",
    productionDomain: env.PRODUCTION_DOMAIN ?? "http://localhost:4321",
    secretKey: env.SECRET_KEY ?? "dev-secret-key-change-before-production",
    databaseProvider: env.DATABASE_PROVIDER ?? (env.DATABASE_URL ? "postgres" : "postgres"),
    databaseUrl: env.DATABASE_URL ?? "",
    databaseSchema: env.DATABASE_SCHEMA ?? "public",
    databasePath: env.DATABASE_PATH ?? "./runtime/chibi-app.db",
    stripeSecretKey: env.STRIPE_SECRET_KEY ?? "",
    stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY ?? "",
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
    googleClientId: env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    googleRedirectUri:
        env.GOOGLE_REDIRECT_URI ?? "http://localhost:4321/api/auth/callback/google",
    aiContentServiceUrl: env.AI_CONTENT_SERVICE_URL ?? "http://127.0.0.1:8020",
    aiContentServiceToken: env.AI_CONTENT_SERVICE_TOKEN ?? "",
    aiGenerationProvider: env.AI_CHIBI_GENERATION_PROVIDER ?? "mock",
    aiImageModel: env.AI_CHIBI_IMAGE_MODEL ?? "gpt-image-2",
    aiImageSize: env.AI_CHIBI_IMAGE_SIZE ?? "1:1",
    aiGenerationTimeout: toInt(env.AI_CHIBI_GENERATION_TIMEOUT, 900),
    allowMockFallback: toBool(env.AI_CHIBI_ALLOW_MOCK_FALLBACK, true),
    anonImageDailyLimit: toInt(env.ANON_IMAGE_DAILY_LIMIT, 3),
    anonQuotaEnabled: toBool(env.ANON_IMAGE_QUOTA_ENABLED, true),
    anonRefundOnProviderError: toBool(
        env.ANON_IMAGE_LIMIT_REFUND_ON_PROVIDER_ERROR,
        false,
    ),
    maxRequestBodySize: toInt(env.MAX_REQUEST_BODY_SIZE, 8 * 1024 * 1024),
    trustedProxyIps: env.TRUSTED_PROXY_IPS ?? "127.0.0.1,::1",
    clientIpHeaderOrder:
        env.CLIENT_IP_HEADER_ORDER ?? "CF-Connecting-IP,X-Real-IP,X-Forwarded-For",
    cookieAccessToken: env.COOKIE_ACCESS_TOKEN ?? "access_token",
    cookieRefreshToken: env.COOKIE_REFRESH_TOKEN ?? "refresh_token",
    cookieSessionId: env.COOKIE_SESSION_ID ?? "chibi_session_id",
    devApiTestKey: env.DEV_API_TEST_KEY ?? "",
    devAuthMock: toBool(env.DEV_AUTH_MOCK, false),
    devStripeMock: toBool(env.DEV_STRIPE_MOCK, false),
    devUserEmail: env.DEV_USER_EMAIL ?? "",
    mockUserEmail: env.MOCK_USER_EMAIL ?? env.DEV_USER_EMAIL ?? "dev-test@example.com",
    adminUsers: (env.ADMIN_USERS ?? env.DEV_USER_EMAIL ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    testUsers: (env.TEST_USERS ?? env.DEV_USER_EMAIL ?? "dev-test@example.com").split(",").map((item) => item.trim()).filter(Boolean),
};

export const isDevelopment = serverEnv.appEnv === "development";
export const isProduction = serverEnv.appEnv === "production";
