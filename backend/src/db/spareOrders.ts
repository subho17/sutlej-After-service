import { supabaseAdmin } from "../config/supabase.js";
import type { SpareOrderRow } from "./types.js";

/**
 * PostgREST silently caps how many rows a single request returns
 * (`db-max-rows`, 1000 on Supabase by default), so a plain `select("*")`
 * would quietly drop the oldest orders once the table grows past it. Page
 * through with `range` instead, using an exact count as the stopping hint.
 */
const SELECT_PAGE_SIZE = 1000;

async function selectAllSpareOrders(columns: string): Promise<Record<string, unknown>[]> {
  const { count, error: countError } = await supabaseAdmin()
    .from("spare_orders")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;
  const total = count ?? 0;

  const rows: Record<string, unknown>[] = [];
  let from = 0;
  let pages = 0;

  for (;;) {
    const { data, error } = await supabaseAdmin()
      .from("spare_orders")
      .select(columns)
      .order("created_at", { ascending: false })
      .range(from, from + SELECT_PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...page);
    // Advance by what actually arrived: if the server capped the page below
    // SELECT_PAGE_SIZE, offsetting by SELECT_PAGE_SIZE would skip rows.
    from += page.length;
    pages += 1;

    if (page.length === 0 || rows.length >= total || pages > 200) break;
  }

  return rows;
}

export async function listSpareOrders(): Promise<SpareOrderRow[]> {
  // Pages come back newest-first and are consecutive windows of one ordered
  // query, so concatenating them keeps the whole list in the same order.
  return (await selectAllSpareOrders("*")) as unknown as SpareOrderRow[];
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
 * Is `existing` the same order as `input`, i.e. is an upsert a safe retry
 * rather than a different order that happens to share a number?
 *
 * Clients stamp `createdAt` on every order and resend it unchanged on a
 * retry, so matching timestamps means "same row". Without a usable timestamp
 * we fall back to the content identity (owner + customer + total).
 */
function isSameOrder(existing: SpareOrderRow, input: PortalOrderInput): boolean {
  const incomingAt = Date.parse(input.createdAt ?? "");
  if (!Number.isNaN(incomingAt)) {
    const existingAt = Date.parse(existing.created_at ?? "");
    if (!Number.isNaN(existingAt)) return existingAt === incomingAt;
  }

  return (
    (existing.owner_id ?? null) === (input.ownerId ?? null) &&
    (existing.customer_name ?? null) === (input.customerName ?? null) &&
    Number(existing.total) === (Number(input.total) || 0)
  );
}

/**
 * Next free order number for the requested number's shape: `ORD-2026-0003` →
 * `ORD-2026-0004`, taking the highest existing suffix into account so a gap
 * is never re-issued while another row still holds it.
 */
async function nextFreeOrderNo(requested: string): Promise<string> {
  const match = /^(.*?)(\d+)$/.exec(requested);
  const prefix = match ? match[1] : `${requested}-`;
  const width = match ? match[2].length : 4;
  let highest = match ? parseInt(match[2], 10) : 0;

  // Paged, so the scan still sees the true highest number once the table
  // grows past PostgREST's per-request row cap.
  const data = await selectAllSpareOrders("order_no");

  const taken = new Set<string>();
  for (const row of data) {
    const orderNo = String(row.order_no ?? "");
    if (!orderNo) continue;
    taken.add(orderNo);
    if (!orderNo.startsWith(prefix)) continue;
    const tail = orderNo.slice(prefix.length);
    if (!/^\d+$/.test(tail)) continue;
    const suffix = parseInt(tail, 10);
    if (suffix > highest) highest = suffix;
  }

  for (let n = highest + 1; ; n++) {
    const candidate = `${prefix}${String(n).padStart(width, "0")}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Portal write-through: upserts the portal order into Supabase keyed by
 * order_no, so every device sees it. Retries are idempotent.
 *
 * Guards against the ID-collision data loss the staff portal hits: order
 * numbers were generated from a browser's local row count (or a truncated
 * timestamp), so a device with an empty cache minted `ORD-2026-0001` again
 * and the upsert silently replaced an unrelated order — which is why a new
 * order made the previous one disappear. When the number is already held by
 * a *different* order, this mints a fresh number instead of overwriting, and
 * the caller adopts the returned order_no.
 */
export async function upsertPortalOrder(input: PortalOrderInput): Promise<SpareOrderRow> {
  let orderNo = input.orderNo;

  const { data: existing, error: lookupError } = await supabaseAdmin()
    .from("spare_orders")
    .select("*")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing && !isSameOrder(existing as SpareOrderRow, input)) {
    orderNo = await nextFreeOrderNo(orderNo);
  }

  const { data, error } = await supabaseAdmin()
    .from("spare_orders")
    .upsert(
      {
        order_no: orderNo,
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
