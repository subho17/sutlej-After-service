import "dotenv/config";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { Staff } from "./models/Staff.js";
import { Customer } from "./models/Customer.js";
import { DEMO_STAFF, DEMO_CUSTOMER } from "./data/demo.js";

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

  await Customer.updateOne(
    { customerId: DEMO_CUSTOMER.customerId },
    {
      $set: {
        name: DEMO_CUSTOMER.name,
        customerId: DEMO_CUSTOMER.customerId,
        email: DEMO_CUSTOMER.email,
        phone: DEMO_CUSTOMER.phone,
        passwordHash: DEMO_CUSTOMER.password,
      },
    },
    { upsert: true }
  );

  console.log("[seed] demo customer ready:");
  console.log(`  customerId: ${DEMO_CUSTOMER.customerId}`);
  console.log(`  email     : ${DEMO_CUSTOMER.email}`);
  console.log(`  phone     : ${DEMO_CUSTOMER.phone}`);
  console.log(`  password  : ${DEMO_CUSTOMER.password}`);

  await disconnectDB();
}

main().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
