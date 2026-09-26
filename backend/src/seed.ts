import "dotenv/config";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { Staff } from "./models/Staff.js";
import { DEMO_STAFF } from "./data/demo.js";

async function main() {
  await connectDB(env.MONGO_URI);

  await Staff.updateOne(
    { staffId: DEMO_STAFF.staffId },
    {
      $set: {
        name: DEMO_STAFF.name,
        staffId: DEMO_STAFF.staffId,
        username: DEMO_STAFF.username,
        email: DEMO_STAFF.email,
        phone: DEMO_STAFF.phone,
        passwordHash: DEMO_STAFF.password,
        role: "staff",
      },
    },
    { upsert: true }
  );

  console.log("[seed] demo staff ready:");
  console.log(`  staffId : ${DEMO_STAFF.staffId}`);
  console.log(`  email   : ${DEMO_STAFF.email}`);
  console.log(`  phone   : ${DEMO_STAFF.phone}`);
  console.log(`  password: ${DEMO_STAFF.password}`);

  await disconnectDB();
}

main().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
