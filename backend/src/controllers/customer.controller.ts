import type { Request, Response } from "express";
import { Customer } from "../models/Customer.js";

export async function listCustomers(_req: Request, res: Response) {
  const customers = await Customer.find().sort({ createdAt: -1 }).lean();
  res.json({ data: customers });
}

export async function createCustomer(req: Request, res: Response) {
  const doc = await Customer.create(req.body);
  res.status(201).json({ data: doc });
}
