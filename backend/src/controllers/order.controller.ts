import type { Request, Response } from "express";
import {
  listSpareOrders,
  updatePortalOrderStatus,
  upsertPortalOrder,
} from "../db/spareOrders.js";
import { ApiError } from "../utils/ApiError.js";

// GET /api/orders — staff + customer (ownership filtered client-side).
export async function listOrdersHandler(_req: Request, res: Response) {
  const orders = await listSpareOrders();
  res.json({ data: orders });
}

// POST /api/orders — portal write-through (staff + customer).
// Body: { orderNo, customerName?, phone?, email?, vehicleRegNo?,
//   vehicleModel?, deliveryAddress?, items?, total?, status?, notes?,
//   ownerId?, createdBy?, createdAt? }.
// Idempotent: retries upsert by order_no. If the requested number is already
// held by a *different* order the row is NOT overwritten — a fresh number is
// allocated and returned, and the caller adopts it as its order number.
export async function createOrderHandler(req: Request, res: Response) {
  const b = req.body ?? {};
  const orderNo = String(b.orderNo ?? b.order_no ?? b.id ?? "").trim();

  if (!orderNo) throw new ApiError(400, "orderNo is required");

  const doc = await upsertPortalOrder({
    orderNo,
    customerName: String(b.customerName ?? "").trim() || undefined,
    phone: String(b.phone ?? b.phoneNumber ?? "").trim() || undefined,
    email: String(b.email ?? "").trim() || undefined,
    vehicleRegNo: String(b.vehicleRegNo ?? b.vehicleRegistrationNo ?? "").trim() || undefined,
    vehicleModel: String(b.vehicleModel ?? b.vehicleModel ?? b.model ?? "").trim() || undefined,
    deliveryAddress: String(b.deliveryAddress ?? "").trim() || undefined,
    items: Array.isArray(b.items) ? b.items : [],
    total: Number(b.total ?? b.totalAmount) || 0,
    status: String(b.status ?? "").trim() || undefined,
    notes: String(b.notes ?? "").trim() || undefined,
    ownerId: String(b.ownerId ?? "").trim() || undefined,
    createdBy: b.createdBy === "staff" || req.user?.role === "staff" ? "staff" : "customer",
    createdAt: String(b.createdAt ?? "").trim() || undefined,
  });
  res.status(201).json({ data: doc });
}

// PATCH /api/orders/by-no/:orderNo/status — staff only. Body: { status }
export async function updateOrderStatusHandler(req: Request, res: Response) {
  const orderNo = String(req.params.orderNo ?? "").trim();
  const status = String(req.body?.status ?? "").trim();

  if (!orderNo) throw new ApiError(400, "orderNo is required");
  if (!status) throw new ApiError(400, "status is required");

  await updatePortalOrderStatus(orderNo, status);
  res.json({ message: "Status synced." });
}
