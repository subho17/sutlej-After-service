import { supabaseAdmin } from "../config/supabase.js";
import type { SpareOrderRow } from "./types.js";

export async function listSpareOrders(): Promise<SpareOrderRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("spare_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SpareOrderRow[];
}

export interface PortalOrderInput {
  orderNo: string;
  customerName?: string;
  phone?: string;
  email?: string;
  vehicleRegNo?: string;
  vehicleModel?: string;
  deliveryAddress?: string;
  items?: SpareOrderRow["items"];
  total?: number;
  status?: string;
  notes?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: string;
}

const ORDER_STATUSES = ["pending", "processing", "dispatched", "delivered", "cancelled"] as const;

function normalizeStatus(value: unknown): (typeof ORDER_STATUSES)[number] {
  const v = String(value ?? "pending").trim().toLowerCase();
  return (ORDER_STATUSES as readonly string[]).includes(v)
    ? (v as (typeof ORDER_STATUSES)[number])
    : "pending";
}

/**
 * Portal write-through: upserts the localStorage order into Supabase
 * keyed by order_no, so every device sees it. Retries are idempotent.
 */
export async function upsertPortalOrder(input: PortalOrderInput): Promise<SpareOrderRow> {
  const { data, error } = await supabaseAdmin()
    .from("spare_orders")
    .upsert(
      {
        order_no: input.orderNo,
        customer_name: input.customerName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        vehicle_reg_no: input.vehicleRegNo ?? null,
        vehicle_model: input.vehicleModel ?? null,
        delivery_address: input.deliveryAddress ?? null,
        items: input.items ?? [],
        total: Number(input.total) || 0,
        status: normalizeStatus(input.status),
        notes: input.notes ?? null,
        owner_id: input.ownerId ?? null,
        created_by: input.createdBy === "staff" ? "staff" : "customer",
        ...(input.createdAt ? { created_at: input.createdAt } : {}),
      },
      { onConflict: "order_no" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as SpareOrderRow;
}

/** Staff status moves sync back to Supabase (no-op when order unknown). */
export async function updatePortalOrderStatus(orderNo: string, status: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("spare_orders")
    .update({ status: normalizeStatus(status) })
    .eq("order_no", orderNo);

  if (error) throw error;
}
