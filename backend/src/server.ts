import "dotenv/config";
import { assertEnv, env } from "./config/env.js";
import { createApp } from "./app.js";

async function main() {
  // Fail fast: Supabase is the live database.
  assertEnv();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error("[backend] failed to start", err);
  process.exit(1);
});
