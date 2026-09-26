import type { Request, Response } from "express";
import { Staff } from "../models/Staff.js";
import { Customer } from "../models/Customer.js";
import { DEMO_STAFF, DEMO_CUSTOMER } from "../data/demo.js";
import { ApiError } from "../utils/ApiError.js";

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

// POST /api/auth/staff/login  { identifier, password }
// identifier = staffId | username | email | phone
export async function staffLogin(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier ?? req.body?.username ?? req.body?.email);
  const password = String(req.body?.password ?? "");

  if (!identifier || !password) {
    throw new ApiError(400, "Staff ID / email / phone and password are required");
  }

  // 1) Try DB (works after `npm run seed` with Mongo running)
  const idLower = identifier.toLowerCase();
  const staff = await Staff.findOne({
    $or: [{ staffId: identifier }, { username: identifier }, { email: idLower }, { phone: identifier }],
  }).lean();

  if (staff && staff.passwordHash === password) {
    res.json({
      message: "Login successful",
      data: {
        name: staff.name,
        staffId: staff.staffId,
        email: staff.email,
        demo: false,
      },
    });
    return;
  }

  // 2) Fallback to hardcoded demo (works without Mongo/seed)
  const demoMatch =
    (identifier === DEMO_STAFF.staffId ||
      identifier === DEMO_STAFF.username ||
      identifier.toLowerCase() === DEMO_STAFF.email ||
      identifier === DEMO_STAFF.phone) &&
    password === DEMO_STAFF.password;

  if (demoMatch) {
    res.json({
      message: "Login successful (demo)",
      data: {
        name: DEMO_STAFF.name,
        staffId: DEMO_STAFF.staffId,
        email: DEMO_STAFF.email,
        demo: true,
      },
    });
    return;
  }

  throw new ApiError(401, "Invalid staff credentials. Use the demo ID / email / phone shown on the login page.");
}

export async function customerLogin(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier ?? req.body?.phone ?? req.body?.email);
  const password = String(req.body?.password ?? "");

  if (!identifier || !password) {
    throw new ApiError(400, "Email / phone and password are required");
  }

  // 1) Try DB (works after `npm run seed` with Mongo running)
  const idLower = identifier.toLowerCase();
  const customer = await Customer.findOne({
    $or: [{ customerId: identifier }, { email: idLower }, { phone: identifier }],
  }).lean();

  if (customer && customer.passwordHash === password) {
    res.json({
      message: "Login successful",
      data: {
        name: customer.name,
        customerId: customer.customerId,
        email: customer.email,
        demo: false,
      },
    });
    return;
  }

  // 2) Fallback to hardcoded demo (works without Mongo/seed)
  const demoMatch =
    (identifier === DEMO_CUSTOMER.customerId ||
      identifier.toLowerCase() === DEMO_CUSTOMER.email ||
      identifier === DEMO_CUSTOMER.phone) &&
    password === DEMO_CUSTOMER.password;

  if (demoMatch) {
    res.json({
      message: "Login successful (demo)",
      data: {
        name: DEMO_CUSTOMER.name,
        customerId: DEMO_CUSTOMER.customerId,
        email: DEMO_CUSTOMER.email,
        demo: true,
      },
    });
    return;
  }

  throw new ApiError(401, "Invalid customer credentials.");
}
