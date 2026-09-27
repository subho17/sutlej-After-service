import type { Request, Response } from "express";
import { listStaff } from "../db/staff.js";

export async function listStaffHandler(_req: Request, res: Response) {
  const staff = await listStaff();
  res.json({ data: staff });
}

export async function createStaffHandler(_req: Request, res: Response) {
  // Staff creation (with bcrypt-hashed password + role assignment) lands in
  // Phase 2 alongside an admin user-management screen. Kept explicit so the
  // route doesn't silently accept plain-text passwords.
  res.status(501).json({
    message: "Staff creation is not available yet. Seed staff via supabase/schema.sql.",
  });
}
