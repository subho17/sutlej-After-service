import type { Request, Response } from "express";
import {
  createComplaint,
  listComplaints,
  updatePortalComplaintStatus,
  upsertPortalComplaint,
} from "../db/complaints.js";
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

// POST /api/complaints/portal — portal write-through (staff + customer).
// Body: { ticketNo, title?, description, customerName?, phone?, email?,
//   vehicleRegNo?, vehicleModel?, category?, priority?, status?, source?,
//   ownerId?, createdAt? }.
// Idempotent: retries upsert by ticket_no. If the requested number is already
// held by a *different* complaint the row is NOT overwritten — a fresh number
// is allocated and returned, and the caller adopts it as its ticket.
export async function portalComplaintHandler(req: Request, res: Response) {
  const b = req.body ?? {};
  const ticketNo = String(b.ticketNo ?? b.ticket_no ?? "").trim();
  const description = String(b.description ?? "").trim();

  if (!ticketNo) throw new ApiError(400, "ticketNo is required");
  if (!description) throw new ApiError(400, "description is required");

  const category = String(b.category ?? "").trim();
  const vehicleRegNo = String(b.vehicleRegNo ?? b.vehicleRegistrationNo ?? "").trim();
  const title =
    String(b.title ?? "").trim() ||
    `${category || "General"} - ${vehicleRegNo || ticketNo}`.trim();

  const doc = await upsertPortalComplaint({
    ticketNo,
    title,
    description,
    customerName: String(b.customerName ?? "").trim() || undefined,
    phone: String(b.phone ?? b.phoneNumber ?? "").trim() || undefined,
    email: String(b.email ?? "").trim() || undefined,
    vehicleRegNo: vehicleRegNo || undefined,
    vehicleModel: String(b.vehicleModel ?? b.model ?? "").trim() || undefined,
    category: category || undefined,
    priority: String(b.priority ?? "").trim() || undefined,
    status: String(b.status ?? "").trim() || undefined,
    source: String(b.source ?? "").trim() || undefined,
    ownerId: String(b.ownerId ?? "").trim() || undefined,
    createdBy: req.user?.role,
    createdAt: String(b.createdAt ?? "").trim() || undefined,
  });
  res.status(201).json({ data: doc });
}

// PATCH /api/complaints/by-ticket/:ticketNo/status — staff only.
// Body: { status }
export async function portalComplaintStatusHandler(req: Request, res: Response) {
  const ticketNo = String(req.params.ticketNo ?? "").trim();
  const status = String(req.body?.status ?? "").trim();

  if (!ticketNo) throw new ApiError(400, "ticketNo is required");
  if (!status) throw new ApiError(400, "status is required");

  await updatePortalComplaintStatus(ticketNo, status);
  res.json({ message: "Status synced." });
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
