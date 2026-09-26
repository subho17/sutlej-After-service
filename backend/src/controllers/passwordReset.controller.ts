import type { Request, Response } from "express";
import crypto from "node:crypto";
import { Customer } from "../models/Customer.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { isMailConfigured, sendOtpEmail } from "../utils/mailer.js";

const MAX_ATTEMPTS = 5;

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

function newOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

// POST /api/auth/customer/forgot-password  { identifier }
// identifier = email | phone. Customer-only: staff accounts are never emailed.
export async function requestCustomerPasswordReset(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier);
  if (!identifier) throw new ApiError(400, "Email or phone number is required");

  const idLower = identifier.toLowerCase();
  const customer = await Customer.findOne({
    $or: [{ email: idLower }, { phone: identifier }],
  });

  // Always respond the same way so accounts can't be enumerated.
  if (!customer) {
    res.json({ message: "If an account exists, a reset code has been sent." });
    return;
  }

  if (!customer.email) {
    throw new ApiError(400, "No email is registered on this account. Please contact support.");
  }

  if (!isMailConfigured()) {
    throw new ApiError(503, "Email service is not configured. Please try again later.");
  }

  // Invalidate older codes for this customer, then issue a fresh one.
  await PasswordReset.updateMany(
    { customerId: customer._id, used: false },
    { $set: { used: true } }
  );

  const otp = newOtp();
  await PasswordReset.create({
    customerId: customer._id,
    email: customer.email,
    otp,
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
  });

  await sendOtpEmail(customer.email, otp, customer.name);

  res.json({ message: "If an account exists, a reset code has been sent." });
}

// POST /api/auth/customer/reset-password  { identifier, otp, newPassword }
export async function resetCustomerPassword(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier);
  const otp = normalize(req.body?.otp);
  const newPassword = String(req.body?.newPassword ?? "");

  if (!identifier || !otp) throw new ApiError(400, "Identifier and OTP are required");
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const idLower = identifier.toLowerCase();
  const customer = await Customer.findOne({
    $or: [{ email: idLower }, { phone: identifier }],
  });
  if (!customer) throw new ApiError(400, "Invalid code. Please request a new one.");

  const record = await PasswordReset.findOne({
    customerId: customer._id,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) throw new ApiError(400, "Code expired. Please request a new one.");

  if (record.attempts >= MAX_ATTEMPTS) {
    record.used = true;
    await record.save();
    throw new ApiError(429, "Too many attempts. Please request a new code.");
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, "Invalid code. Please try again.");
  }

  // NOTE: demo only — hash passwords (bcrypt) before production use.
  customer.passwordHash = newPassword;
  await customer.save();

  record.used = true;
  await record.save();

  res.json({ message: "Password updated. You can now log in." });
}
