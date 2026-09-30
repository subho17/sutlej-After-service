import type { Request, Response } from "express";
import { createCustomerAccount, emailOrPhoneTaken } from "../db/customers.js";
import { createVehicle } from "../db/vehicles.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { hashSecret } from "../utils/password.js";
import { signAuthToken } from "../utils/tokens.js";

const COOKIE_NAME = "sutlej_token";

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

function newCustomerId(): string {
  return `CUST${Date.now().toString().slice(-6)}`;
}

// POST /api/auth/customer/signup
// { name, phone, email, password, companyName?, gstNumber?,
//   regNo, model, purchaseDate? }
// Direct account creation (no OTP): creates the customer + vehicle rows
// and logs the user in via httpOnly cookie.
export async function signup(req: Request, res: Response) {
  const name = normalize(req.body?.name);
  const phone = normalize(req.body?.phone);
  const email = normalize(req.body?.email).toLowerCase();
  const password = String(req.body?.password ?? "");
  const companyName = normalize(req.body?.companyName) || undefined;
  const gstNumber = normalize(req.body?.gstNumber) || undefined;
  const regNo = normalize(req.body?.regNo).toUpperCase();
  const model = normalize(req.body?.model);
  const purchaseDate = normalize(req.body?.purchaseDate);

  if (!name || !phone || !email) {
    throw new ApiError(400, "Name, phone and email are required");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }
  if (!regNo || !model) {
    throw new ApiError(400, "Vehicle registration number and model are required");
  }

  if (await emailOrPhoneTaken(email, phone)) {
    throw new ApiError(409, "An account with this email or phone already exists. Please log in.");
  }

  // First quarterly service lands ~90 days after purchase (or from today).
  const base = purchaseDate ? new Date(`${purchaseDate}T00:00:00`) : new Date();
  const nextService = new Date(isNaN(base.getTime()) ? new Date() : base);
  nextService.setDate(nextService.getDate() + 90);

  let customer;
  try {
    customer = await createCustomerAccount({
      name,
      phone,
      email,
      customerId: newCustomerId(),
      passwordHash: await hashSecret(password),
      companyName,
      gstNumber,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/duplicate|unique|conflict/i.test(message)) {
      throw new ApiError(409, "An account with this email or phone already exists. Please log in.");
    }
    throw err;
  }

  try {
    await createVehicle({
      customerId: customer.id,
      regNo,
      model,
      nextServiceAt: nextService,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/duplicate|unique|conflict/i.test(message)) {
      throw new ApiError(409, "This vehicle registration number is already registered.");
    }
    throw err;
  }

  const token = signAuthToken({ sub: customer.id, role: "customer", name: customer.name });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.status(201).json({
    message: "Account created.",
    data: { name: customer.name, customerId: customer.customer_id, email: customer.email },
  });
}
