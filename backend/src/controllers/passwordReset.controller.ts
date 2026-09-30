import type { Request, Response } from "express";
import crypto from "node:crypto";
import { findCustomerByIdentifier, updateCustomerPassword } from "../db/customers.js";
import { findStaffByIdentifier, updateStaffPassword } from "../db/staff.js";
import {
  bumpResetAttempts,
  createReset,
  invalidateResets,
  latestActiveReset,
  markResetUsed,
} from "../db/passwordResets.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { isMailConfigured, sendOtpEmail } from "../utils/mailer.js";
import { hashSecret, verifySecret } from "../utils/password.js";

const MAX_ATTEMPTS = 5;

function normalize(v: unknown): string {
  return String(v ?? "").trim();
}

function newOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

// POST /api/auth/customer/forgot-password  { identifier }
// identifier = email | phone. OTP goes to the customer's own email.
export async function requestCustomerPasswordReset(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier);
  if (!identifier) throw new ApiError(400, "Email or phone number is required");

  const customer = await findCustomerByIdentifier(identifier);

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

  await invalidateResets("customer", customer.id);

  const otp = newOtp();
  await createReset({
    role: "customer",
    accountId: customer.id,
    email: customer.email,
    otpHash: await hashSecret(otp),
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
  });

  // Send in background: respond now instead of waiting on the SMTP handshake.
  sendOtpEmail(customer.email, otp, customer.name).catch((err) => {
    console.error("[backend] failed to send customer OTP email", err);
  });

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

  const customer = await findCustomerByIdentifier(identifier);
  if (!customer) throw new ApiError(400, "Invalid code. Please request a new one.");

  const record = await latestActiveReset("customer", customer.id);
  if (!record) throw new ApiError(400, "Code expired. Please request a new one.");

  if (record.attempts >= MAX_ATTEMPTS) {
    await markResetUsed(record.id, record.attempts);
    throw new ApiError(429, "Too many attempts. Please request a new code.");
  }

  if (!(await verifySecret(otp, record.otp_hash))) {
    await bumpResetAttempts(record.id, record.attempts + 1);
    throw new ApiError(400, "Invalid code. Please try again.");
  }

  await updateCustomerPassword(customer.id, await hashSecret(newPassword));
  await markResetUsed(record.id, record.attempts);

  res.json({ message: "Password updated. You can now log in." });
}

// POST /api/auth/staff/forgot-password  { identifier }
// identifier = staffId | username | email | phone.
// The OTP is ALWAYS sent to the fixed admin inbox (env.STAFF_RESET_EMAIL),
// never to the staff member's own email.
export async function requestStaffPasswordReset(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier);
  if (!identifier) throw new ApiError(400, "Staff ID / email / phone is required");

  const staff = await findStaffByIdentifier(identifier);

  // Always respond the same way so accounts can't be enumerated.
  if (!staff) {
    res.json({ message: "If the staff account exists, a reset code has been sent for approval." });
    return;
  }

  if (!isMailConfigured()) {
    throw new ApiError(503, "Email service is not configured. Please try again later.");
  }

  await invalidateResets("staff", staff.id);

  const otp = newOtp();
  await createReset({
    role: "staff",
    accountId: staff.id,
    email: env.STAFF_RESET_EMAIL.toLowerCase(),
    otpHash: await hashSecret(otp),
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
  });

  // Send in background: respond now instead of waiting on the SMTP handshake.
  sendOtpEmail(env.STAFF_RESET_EMAIL, otp, `${staff.name} (${staff.staff_id})`).catch((err) => {
    console.error("[backend] failed to send staff OTP email", err);
  });

  res.json({ message: "If the staff account exists, a reset code has been sent for approval." });
}

// POST /api/auth/staff/reset-password  { identifier, otp, newPassword }
export async function resetStaffPassword(req: Request, res: Response) {
  const identifier = normalize(req.body?.identifier);
  const otp = normalize(req.body?.otp);
  const newPassword = String(req.body?.newPassword ?? "");

  if (!identifier || !otp) throw new ApiError(400, "Identifier and OTP are required");
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const staff = await findStaffByIdentifier(identifier);
  if (!staff) throw new ApiError(400, "Invalid code. Please request a new one.");

  const record = await latestActiveReset("staff", staff.id);
  if (!record) throw new ApiError(400, "Code expired. Please request a new one.");

  if (record.attempts >= MAX_ATTEMPTS) {
    await markResetUsed(record.id, record.attempts);
    throw new ApiError(429, "Too many attempts. Please request a new code.");
  }

  if (!(await verifySecret(otp, record.otp_hash))) {
    await bumpResetAttempts(record.id, record.attempts + 1);
    throw new ApiError(400, "Invalid code. Please try again.");
  }

  await updateStaffPassword(staff.id, await hashSecret(newPassword));
  await markResetUsed(record.id, record.attempts);

  res.json({ message: "Password updated. You can now log in." });
}
