import "dotenv/config";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDB(env.MONGO_URI);

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error("[backend] failed to start", err);
  process.exit(1);
});
