import "dotenv/config";
import dns from "node:dns";
import { assertEnv, env } from "./config/env.js";
import { logMailConfig } from "./utils/mailer.js";
import { createApp } from "./app.js";

// Render (and similar hosts) have no IPv6 egress: smtp.gmail.com often
// resolves to IPv6 first, which fails with ENETUNREACH. Prefer IPv4 so
// Nodemailer connects over IPv4.
dns.setDefaultResultOrder("ipv4first");

async function main() {
  // Fail fast: Supabase is the live database.
  assertEnv();
  logMailConfig();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error("[backend] failed to start", err);
  process.exit(1);
});
