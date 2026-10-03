import type { Request, Response } from "express";
import { findStaffByIdentifier } from "../db/staff.js";
import { findCustomerByIdentifier } from "../db/customers.js";
import { verifySecret } from "../utils/password.js";
import { signAuthToken } from "../utils/tokens.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const COOKIE_NAME = "sutlej_token";

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    // Cross-site frontend (Vercel) <-> backend (Render): must be "none".
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

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

  const staff = await findStaffByIdentifier(identifier);
  if (!staff || !(await verifySecret(password, staff.password_hash))) {
    throw new ApiError(401, "Invalid staff credentials.");
  }

  const token = signAuthToken({ sub: staff.id, role: "staff", name: staff.name });
  setAuthCookie(res, token);

  res.json({
    message: "Login successful",
    data: { name: staff.name, staffId: staff.staff_id, email: staff.email, role: "staff" },
  });
}

// POST /api/auth/customer/login  { identifier, password }
// identifier = customerId | email | phone
export async function customerLogin(req: Request, res: Response) {
  const identifier = normalize(
    req.body?.identifier ?? req.body?.phone ?? req.body?.email
  );
  const password = String(req.body?.password ?? "");

  if (!identifier || !password) {
    throw new ApiError(400, "Email / phone and password are required");
  }

  const customer = await findCustomerByIdentifier(identifier);
  if (!customer?.password_hash || !(await verifySecret(password, customer.password_hash))) {
    throw new ApiError(401, "Invalid customer credentials.");
  }

  const token = signAuthToken({ sub: customer.id, role: "customer", name: customer.name });
  setAuthCookie(res, token);

  res.json({
    message: "Login successful",
    data: {
      name: customer.name,
      customerId: customer.customer_id,
      email: customer.email,
      role: "customer",
    },
  });
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ message: "Logged out." });
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
  if (!req.user) throw new ApiError(401, "Not authenticated. Please log in.");
  res.json({ data: req.user });
}
