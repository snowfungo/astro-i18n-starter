import { serverEnv } from "@/lib/server/config/env";
import { getOriginUrl } from "@/lib/server/http";

export function getGoogleAuthUrl() {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", serverEnv.googleClientId);
    url.searchParams.set("redirect_uri", serverEnv.googleRedirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    return url.toString();
}

export async function exchangeGoogleCode(code: string) {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: serverEnv.googleClientId,
            client_secret: serverEnv.googleClientSecret,
            redirect_uri: serverEnv.googleRedirectUri,
            grant_type: "authorization_code",
        }),
    });

    if (!tokenResponse.ok) {
        throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        },
    );

    if (!profileResponse.ok) {
        throw new Error(`Google profile fetch failed: ${profileResponse.status}`);
    }

    return (await profileResponse.json()) as {
        sub: string;
        email: string;
        name: string;
        picture: string;
    };
}

export function getDashboardUrl() {
    const origin = getOriginUrl();
    return new URL("/dashboard", origin).toString();
}
