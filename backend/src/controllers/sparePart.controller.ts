import type { Request, Response } from "express";
import { createSparePart, deleteSparePart, listSpareParts, updateSparePart } from "../db/spareParts.js";
import { ApiError } from "../utils/ApiError.js";

export async function listSparePartsHandler(_req: Request, res: Response) {
  const rows = await listSpareParts();
  res.json({ data: rows });
}

export async function createSparePartHandler(req: Request, res: Response) {
  const sku = String(req.body?.sku ?? req.body?.id ?? "").trim();
  const name = String(req.body?.name ?? "").trim();
  const category = String(req.body?.category ?? "").trim();
  const price = Number(req.body?.price ?? 0);
  const stock = Number(req.body?.stock ?? 0);

  if (!sku || !name || !category) throw new ApiError(400, "sku, name and category are required");
  if (Number.isNaN(price) || price < 0) throw new ApiError(400, "price must be >= 0");
  if (Number.isNaN(stock) || stock < 0) throw new ApiError(400, "stock must be >= 0");

  const row = await createSparePart({ sku, name, category, price, stock });
  res.status(201).json({ data: row });
}

export async function updateSparePartHandler(req: Request, res: Response) {
  const sku = String(req.params.sku ?? "").trim();
  if (!sku) throw new ApiError(400, "sku is required");
  const patch: { name?: string; category?: string; price?: number; stock?: number } = {};
  if (req.body?.name !== undefined) patch.name = String(req.body.name);
  if (req.body?.category !== undefined) patch.category = String(req.body.category);
  if (req.body?.price !== undefined) patch.price = Number(req.body.price);
  if (req.body?.stock !== undefined) patch.stock = Number(req.body.stock);
  const row = await updateSparePart(sku, patch);
  res.json({ data: row });
}

export async function deleteSparePartHandler(req: Request, res: Response) {
  const sku = String(req.params.sku ?? "").trim();
  if (!sku) throw new ApiError(400, "sku is required");
  await deleteSparePart(sku);
  res.json({ message: "Spare part deleted." });
}
