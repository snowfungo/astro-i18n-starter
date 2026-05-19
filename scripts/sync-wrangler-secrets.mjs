import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_SECRET_KEYS = [
  "DATABASE_URL",
  "SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AI_CONTENT_SERVICE_TOKEN",
  "DEV_API_TEST_KEY",
];

function parseArgs(argv) {
  const result = {
    envFile: ".env",
    environment: "",
    name: "",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--env-file") {
      result.envFile = argv[index + 1] ?? result.envFile;
      index += 1;
      continue;
    }
    if (arg === "--env") {
      result.environment = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--name") {
      result.name = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      result.dryRun = true;
    }
  }

  return result;
}

function parseDotEnv(input) {
  const output = {};
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }
  return output;
}

function resolveSecretKeys(envMap) {
  if (process.env.WRANGLER_SECRET_KEYS?.trim()) {
    return process.env.WRANGLER_SECRET_KEYS.split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return DEFAULT_SECRET_KEYS.filter((key) => key in envMap);
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rawEnv = await readFile(options.envFile, "utf8");
  const envMap = parseDotEnv(rawEnv);
  const keys = resolveSecretKeys(envMap);

  if (!keys.length) {
    throw new Error("No secret keys found. Set WRANGLER_SECRET_KEYS or add supported keys to the env file.");
  }

  const secrets = Object.fromEntries(
    keys
      .filter((key) => envMap[key] !== undefined && envMap[key] !== "")
      .map((key) => [key, envMap[key]]),
  );

  if (!Object.keys(secrets).length) {
    throw new Error("Secret keys were found, but all values are empty.");
  }

  if (options.dryRun) {
    console.log("Secrets selected for sync:");
    for (const key of Object.keys(secrets)) {
      console.log(`- ${key}`);
    }
    return;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "wrangler-secrets-"));
  const tempFile = join(tempDir, "secrets.json");

  try {
    await writeFile(tempFile, `${JSON.stringify(secrets, null, 2)}\n`, "utf8");

    const args = ["exec", "wrangler", "secret", "bulk", tempFile];
    if (options.environment) {
      args.push("--env", options.environment);
    }
    if (options.name) {
      args.push("--name", options.name);
    }

    await runCommand("pnpm", args);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
