import type { Request, Response } from "express";
import { createComplaint, listComplaints } from "../db/complaints.js";
import { ApiError } from "../utils/ApiError.js";

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
