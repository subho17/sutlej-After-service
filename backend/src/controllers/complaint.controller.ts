import type { Request, Response } from "express";
import { Complaint } from "../models/Complaint.js";

export async function listComplaints(_req: Request, res: Response) {
  const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
  res.json({ data: complaints });
}

export async function createComplaint(req: Request, res: Response) {
  const doc = await Complaint.create(req.body);
  res.status(201).json({ data: doc });
}
