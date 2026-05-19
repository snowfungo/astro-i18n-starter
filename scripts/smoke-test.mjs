import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const port = Number(process.env.SMOKE_PORT || 4337);
const baseUrl = `http://127.0.0.1:${port}`;

function startServer() {
  const child = spawn("node", ["./dist/server/entry.mjs"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      APP_ENV: "development",
      APP_URL: baseUrl,
      PRODUCTION_DOMAIN: baseUrl,
      SECRET_KEY: "smoke-test-secret",
      DATABASE_PATH: "./runtime/chibi-smoke.db",
      DEV_API_TEST_KEY: "local-smoke-test-key",
      MOCK_USER_EMAIL: "dev-test@example.com",
      ADMIN_USERS: "dev-test@example.com",
      TEST_USERS: "dev-test@example.com",
      AI_CHIBI_GENERATION_PROVIDER: "mock",
      AI_CHIBI_ALLOW_MOCK_FALLBACK: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error("Server did not become healthy in time");
}

function splitSetCookie(headerValue) {
  if (!headerValue) {
    return [];
  }
  return headerValue.split(/, (?=[^;]+?=)/g).map((item) => item.split(";")[0]);
}

function mergeCookieJar(existing, incoming) {
  const cookies = new Map();
  for (const item of existing) {
    const [name] = item.split("=");
    cookies.set(name, item);
  }
  for (const item of incoming) {
    const [name] = item.split("=");
    cookies.set(name, item);
  }
  return [...cookies.values()];
}

async function request(path, init = {}, jar = []) {
  const headers = new Headers(init.headers || {});
  if (jar.length) {
    headers.set("cookie", jar.join("; "));
  }
  if (!headers.has("origin")) {
    headers.set("origin", baseUrl);
  }
  if (!headers.has("referer")) {
    headers.set("referer", `${baseUrl}/`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });

  const nextJar = mergeCookieJar(jar, splitSetCookie(response.headers.get("set-cookie")));
  return {
    response,
    cookies: nextJar,
    json: async () => response.json(),
    text: async () => response.text(),
  };
}

async function assertHtml(path, jar, expectedText = "AI Chibi Generator") {
  const result = await request(path, {}, jar);
  if (!result.response.ok) {
    throw new Error(`${path} failed with ${result.response.status}`);
  }
  const html = await result.text();
  if (!html.includes(expectedText)) {
    throw new Error(`${path} missing expected text: ${expectedText}`);
  }
}

async function run() {
  const server = startServer();

  try {
    await waitForHealth();

    let jar = [];

    let result = await request("/api/auth/mock-login", {}, jar);
    jar = result.cookies;
    if (result.response.status !== 302) {
      throw new Error(`Mock login failed with status ${result.response.status}`);
    }

    result = await request("/api/auth/me", {}, jar);
    const me = await result.json();
    if (!result.response.ok || !me.authenticated || !me.user?.id) {
      throw new Error(`Auth session missing after mock login: ${JSON.stringify(me)}`);
    }

    const generationForm = new FormData();
    generationForm.set("prompt", "Pastel wizard fox with tiny cape");
    generationForm.set("style", "classic");
    result = await request("/api/images/generate", { method: "POST", body: generationForm }, jar);
    const generated = await result.json();
    if (!result.response.ok || !generated.output_url) {
      throw new Error(`Image generation failed: ${JSON.stringify(generated)}`);
    }

    result = await request("/api/images/history", {}, jar);
    const history = await result.json();
    if (!Array.isArray(history.items) || history.items.length < 1) {
      throw new Error(`Image history missing generated result: ${JSON.stringify(history)}`);
    }

    result = await request(
      "/api/payments/create-checkout",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "starter" }),
      },
      jar,
    );
    const checkout = await result.json();
    if (!result.response.ok || !checkout.url) {
      throw new Error(`Checkout failed: ${JSON.stringify(checkout)}`);
    }

    result = await request("/api/payments/subscription", {}, jar);
    const subscription = await result.json();
    if (!result.response.ok || !subscription.plan || Number(subscription.credits ?? 0) <= 0) {
      throw new Error(`Subscription endpoint failed: ${JSON.stringify(subscription)}`);
    }

    result = await request("/api/admin/users", {}, jar);
    const adminUsers = await result.json();
    if (!result.response.ok || !Array.isArray(adminUsers.items) || !adminUsers.items.length) {
      throw new Error(`Admin users endpoint failed: ${JSON.stringify(adminUsers)}`);
    }

    const targetUser = adminUsers.items[0];

    result = await request(
      "/api/admin/fill-credits",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, amount: 5 }),
      },
      jar,
    );
    if (!result.response.ok) {
      throw new Error(`Admin fill credits failed: ${await result.text()}`);
    }

    result = await request(
      "/api/admin/set-plan",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, plan: "value" }),
      },
      jar,
    );
    if (!result.response.ok) {
      throw new Error(`Admin set plan failed: ${await result.text()}`);
    }

    result = await request(generated.output_url, {}, jar);
    if (!result.response.ok) {
      throw new Error(`Generated archive failed: ${result.response.status}`);
    }

    result = await request("/api/account/export", {}, jar);
    const account = await result.json();
    if (!result.response.ok || !account.profile?.email) {
      throw new Error(`Account export failed: ${JSON.stringify(account)}`);
    }

    await assertHtml("/", jar);
    await assertHtml("/photo-to-chibi", jar);
    await assertHtml("/pricing", jar);
    await assertHtml("/dashboard", jar);
    await assertHtml("/admin", jar);
    await assertHtml("/zh", jar);
    await assertHtml("/ja", jar);
    await assertHtml("/es", jar);
    await assertHtml("/fr", jar);

    console.log("\nSmoke test passed");
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
