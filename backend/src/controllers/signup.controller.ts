import type { Request, Response } from "express";
import crypto from "node:crypto";
import {
  bumpSignupAttempts,
  createSignupRequest,
  invalidateSignupRequests,
  latestActiveSignupRequest,
  markSignupUsed,
} from "../db/signupRequests.js";
import { createCustomerAccount, emailOrPhoneTaken } from "../db/customers.js";
import { createVehicle } from "../db/vehicles.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { isMailConfigured, sendSignupOtpEmail } from "../utils/mailer.js";
import { hashSecret, verifySecret } from "../utils/password.js";
import { signAuthToken } from "../utils/tokens.js";

const MAX_ATTEMPTS = 5;
const COOKIE_NAME = "sutlej_token";

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

function newOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function newCustomerId(): string {
  return `CUST${Date.now().toString().slice(-6)}`;
}

// POST /api/auth/customer/signup/request  { name, phone, email }
export async function requestSignupOtp(req: Request, res: Response) {
  const name = normalize(req.body?.name);
  const phone = normalize(req.body?.phone);
  const email = normalize(req.body?.email).toLowerCase();

  if (!name || !phone || !email) {
    throw new ApiError(400, "Name, phone and email are required");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }
  if (!isMailConfigured()) {
    throw new ApiError(503, "Email service is not configured. Please try again later.");
  }

  if (await emailOrPhoneTaken(email, phone)) {
    throw new ApiError(409, "An account with this email or phone already exists. Please log in.");
  }

  await invalidateSignupRequests(email);

  const otp = newOtp();
  await createSignupRequest({
    name,
    phone,
    email,
    otpHash: await hashSecret(otp),
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
  });

  // Send in background: respond now instead of waiting on the SMTP handshake.
  sendSignupOtpEmail(email, otp, name).catch((err) => {
    console.error("[backend] failed to send signup OTP email", err);
  });

  res.json({ message: "Verification code sent to your email." });
}

// POST /api/auth/customer/signup/verify
// { email, otp, name, phone, password, companyName?, gstNumber?,
//   regNo, model, purchaseDate? }
export async function verifySignup(req: Request, res: Response) {
  const email = normalize(req.body?.email).toLowerCase();
  const otp = normalize(req.body?.otp);
  const name = normalize(req.body?.name);
  const phone = normalize(req.body?.phone);
  const password = String(req.body?.password ?? "");
  const companyName = normalize(req.body?.companyName) || undefined;
  const gstNumber = normalize(req.body?.gstNumber) || undefined;
  const regNo = normalize(req.body?.regNo).toUpperCase();
  const model = normalize(req.body?.model);
  const purchaseDate = normalize(req.body?.purchaseDate);

  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");
  if (!name || !phone) throw new ApiError(400, "Name and phone are required");
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters.");
  if (!regNo || !model) throw new ApiError(400, "Vehicle registration number and model are required");

  const record = await latestActiveSignupRequest(email);
  if (!record) throw new ApiError(400, "Code expired. Please request a new one.");

  if (record.attempts >= MAX_ATTEMPTS) {
    await markSignupUsed(record.id, record.attempts);
    throw new ApiError(429, "Too many attempts. Please request a new code.");
  }

  if (!(await verifySecret(otp, record.otp_hash))) {
    await bumpSignupAttempts(record.id, record.attempts + 1);
    throw new ApiError(400, "Invalid code. Please try again.");
  }

  if (await emailOrPhoneTaken(email, phone)) {
    await markSignupUsed(record.id, record.attempts);
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

  await markSignupUsed(record.id, record.attempts);

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
