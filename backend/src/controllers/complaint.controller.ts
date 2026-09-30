import type { Request, Response } from "express";
import { createComplaint, listComplaints } from "../db/complaints.js";
import { ApiError } from "../utils/ApiError.js";
import { isMailConfigured, sendStaffEmail } from "../utils/mailer.js";

export async function listComplaintsHandler(_req: Request, res: Response) {
  const complaints = await listComplaints();
  res.json({ data: complaints });
}

export async function createComplaintHandler(req: Request, res: Response) {
  const title = String(req.body?.title ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const createdBy = String(req.body?.createdBy ?? "").trim() || undefined;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const doc = await createComplaint({ title, description, createdBy });
  res.status(201).json({ data: doc });
}

// POST /api/complaints/notify  { to, subject, message }
// Staff-only: sends a formal email (e.g. complaint status update).
// Responds immediately; delivery happens in the background and failures
// are logged server-side (SMTP may be blocked on free hosting tiers).
export async function notifyComplaintHandler(req: Request, res: Response) {
  const to = String(req.body?.to ?? "").trim();
  const subject = String(req.body?.subject ?? "").trim();
  const message = String(req.body?.message ?? "").trim();

  if (!to || !subject || !message) {
    throw new ApiError(400, "Recipient, subject and message are required");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    throw new ApiError(400, "Recipient email is invalid.");
  }
  if (!isMailConfigured()) {
    throw new ApiError(503, "Email service is not configured.");
  }

  sendStaffEmail(to, subject, message).catch((err) => {
    console.error("[backend] failed to send complaint email", err);
  });

  res.status(202).json({ message: "Email queued for delivery." });
}
