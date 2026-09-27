import type { Request, Response } from "express";
import { createCustomer, listCustomers } from "../db/customers.js";
import { ApiError } from "../utils/ApiError.js";

export async function listCustomersHandler(_req: Request, res: Response) {
  const customers = await listCustomers();
  res.json({ data: customers });
}

export async function createCustomerHandler(req: Request, res: Response) {
  const name = String(req.body?.name ?? "").trim();
  const phone = String(req.body?.phone ?? "").trim();
  const email = String(req.body?.email ?? "").trim() || undefined;

  if (!name || !phone) throw new ApiError(400, "Name and phone are required");

  const doc = await createCustomer({ name, phone, email });
  res.status(201).json({ data: doc });
}
