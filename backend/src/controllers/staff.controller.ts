import type { Request, Response } from "express";
import { Staff } from "../models/Staff.js";

export async function listStaff(_req: Request, res: Response) {
  const staff = await Staff.find().sort({ createdAt: -1 }).lean();
  res.json({ data: staff });
}

export async function createStaff(req: Request, res: Response) {
  const doc = await Staff.create(req.body);
  res.status(201).json({ data: doc });
}
