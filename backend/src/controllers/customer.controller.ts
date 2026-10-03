import type { Request, Response } from "express";
import { createCustomer, findCustomerById, listCustomers } from "../db/customers.js";
import { ApiError } from "../utils/ApiError.js";

export async function listCustomersHandler(_req: Request, res: Response) {
  const customers = await listCustomers();
  res.json({ data: customers });
}

// GET /api/customers/me — the signed-in customer's own profile.
// Lets the portal hydrate phone/email for sessions opened before those
// fields were added to the login response.
export async function currentCustomerHandler(req: Request, res: Response) {
  if (req.user?.role !== "customer") {
    throw new ApiError(403, "Only customer accounts have a portal profile.");
  }

  const customer = await findCustomerById(req.user.sub);
  if (!customer) throw new ApiError(404, "Customer profile not found.");

  res.json({
    data: {
      name: customer.name,
      customerId: customer.customer_id,
      phone: customer.phone,
      email: customer.email,
      role: "customer",
    },
  });
}

export async function createCustomerHandler(req: Request, res: Response) {
  const name = String(req.body?.name ?? "").trim();
  const phone = String(req.body?.phone ?? "").trim();
  const email = String(req.body?.email ?? "").trim() || undefined;

  if (!name || !phone) throw new ApiError(400, "Name and phone are required");

  const doc = await createCustomer({ name, phone, email });
  res.status(201).json({ data: doc });
}
