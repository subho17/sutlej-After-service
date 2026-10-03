import type { Request, Response } from "express";
import { createVehicle, listVehicles } from "../db/vehicles.js";
import { ApiError } from "../utils/ApiError.js";

export async function listVehiclesHandler(req: Request, res: Response) {
  // Customers see only their own vehicles; staff see all.
  const customerId = req.user?.role === "customer" ? req.user!.sub : undefined;
  const rows = await listVehicles(customerId);
  res.json({ data: rows });
}

export async function createVehicleHandler(req: Request, res: Response) {
  const regNo = String(req.body?.reg_no ?? req.body?.registrationNo ?? "").trim();
  const model = String(req.body?.model ?? "").trim();
  const nextServiceAtRaw = req.body?.next_service_at ?? req.body?.nextServiceDate;

  if (!regNo || !model) throw new ApiError(400, "Registration number and model are required");

  let nextServiceAt: Date;
  const parsed = nextServiceAtRaw ? new Date(nextServiceAtRaw) : null;
  if (parsed && !isNaN(parsed.getTime())) {
    nextServiceAt = parsed;
  } else {
    // Default: next quarterly service in ~3 months.
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    nextServiceAt = d;
  }

  const customerId = req.user?.role === "customer" ? req.user!.sub : String(req.body?.customerId ?? "");
  if (!customerId) throw new ApiError(400, "Customer id is required");

  const row = await createVehicle({ customerId, regNo, model, nextServiceAt });
  res.status(201).json({ data: row });
}
