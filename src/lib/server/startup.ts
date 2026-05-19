import { migrateDb } from "@/lib/server/db/migrate";

let readyPromise: Promise<void> | null = null;

export async function ensureAppReady() {
  if (!readyPromise) {
    readyPromise = migrateDb();
  }
  await readyPromise;
}
