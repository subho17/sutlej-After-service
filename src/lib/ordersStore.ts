// Single source of truth for spare-part orders (staff + customer).
//
// No localStorage: the in-memory cache below is the interactive source of
// truth, and the backend (Supabase) is the shared copy every device syncs
// with. On a fresh load the cache is populated by syncOrdersFromBackend().

export interface SharedOrderItem {
  partId?: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
}

export interface SharedOrder {
  id: string;
  customerName: string;
  /** Account id of the customer who placed it (missing on legacy/staff rows). */
  ownerId?: string;
  phoneNumber: string;
  email?: string;
  vehicleRegistrationNo?: string;
  vehicleModel?: string;
  deliveryAddress?: string;
  items: SharedOrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "dispatched" | "delivered" | "cancelled";
  createdAt: string;
  /** Display date (customer portal). Always filled by normalizeOrder. */
  date: string;
  /** Last edit time (local or from Supabase). Drives the sync merge. */
  updatedAt?: string;
  notes?: string;
}

type RawOrder = Partial<SharedOrder> & { id: string };

/** Fill missing fields so staff- and customer-shaped orders both render. */
export function normalizeOrder(raw: RawOrder): SharedOrder {
  const date =
    typeof raw.date === "string" && raw.date
      ? raw.date
      : typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString();
  return {
    id: String(raw.id),
    customerName: typeof raw.customerName === "string" ? raw.customerName : "",
    ownerId:
      typeof (raw as { ownerId?: unknown }).ownerId === "string"
        ? (raw as { ownerId?: string }).ownerId
        : undefined,
    phoneNumber: typeof raw.phoneNumber === "string" ? raw.phoneNumber : "",
    email: typeof raw.email === "string" ? raw.email : undefined,
    vehicleRegistrationNo:
      typeof raw.vehicleRegistrationNo === "string" ? raw.vehicleRegistrationNo : undefined,
    vehicleModel: typeof raw.vehicleModel === "string" ? raw.vehicleModel : undefined,
    deliveryAddress:
      typeof raw.deliveryAddress === "string" ? raw.deliveryAddress : undefined,
    items: Array.isArray(raw.items)
      ? raw.items.map((it) => ({
          partId: typeof it?.partId === "string" ? it.partId : undefined,
          partName: typeof it?.partName === "string" ? it.partName : "Spare Part",
          partNumber: typeof it?.partNumber === "string" ? it.partNumber : undefined,
          quantity: Number(it?.quantity) || 0,
          unitPrice: Number(it?.unitPrice) || 0,
        }))
      : [],
    totalAmount: Number(raw.totalAmount) || 0,
    status:
      raw.status === "processing" ||
      raw.status === "dispatched" ||
      raw.status === "delivered" ||
      raw.status === "cancelled"
        ? raw.status
        : "pending",
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt ? raw.createdAt : date,
    date,
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt ? raw.updatedAt : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
}

// ---------------------------------------------------------------------------
// In-memory cache + same-tab listeners
// ---------------------------------------------------------------------------

let ordersCache: SharedOrder[] = [];
type Listener = () => void;
const orderListeners = new Set<Listener>();

function notifyOrderListeners(): void {
  for (const listener of orderListeners) listener();
}

/** Load all orders (in-memory; populated by backend sync). */
export function loadOrders(): SharedOrder[] {
  return ordersCache;
}

/** Save orders — visible to BOTH staff and customer immediately. */
export function saveOrders(orders: SharedOrder[]): void {
  ordersCache = orders.map(normalizeOrder).sort(byNewestFirst);
  notifyOrderListeners();
}

/**
 * Next unused order number, derived from the highest suffix already held
 * instead of `cache.length + 1`.
 *
 * The count-based formula is what made orders disappear: a device whose
 * cache had not synced yet (or that had just used "Clear all") minted
 * `ORD-2026-0001` again, the backend upsert keyed on order_no replaced the
 * existing row, and the new order silently overwrote the previous one. The
 * backend still mints a free number if a race slips through — this just
 * stops the collision happening at source.
 */
export function nextOrderNo(prefix = "ORD-2026-"): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const shape = new RegExp(`^${escaped}(\\d+)$`);

  const taken = new Set<string>();
  let highest = 0;
  for (const order of ordersCache) {
    taken.add(order.id);
    const match = shape.exec(order.id);
    if (!match) continue;
    const suffix = parseInt(match[1], 10);
    if (suffix > highest) highest = suffix;
  }

  let n = highest + 1;
  let candidate = `${prefix}${String(n).padStart(4, "0")}`;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${prefix}${String(n).padStart(4, "0")}`;
  }
  return candidate;
}

/**
 * Re-key a local order when the backend assigned it a different number (it
 * found the requested one already held by an unrelated order). Keeps this
 * device, the backend and the success toast agreeing on one id — without it
 * the next sync would show the same order twice.
 */
export function renameOrderId(oldId: string, newId: string): void {
  if (!newId || oldId === newId) return;
  const index = ordersCache.findIndex((o) => o.id === oldId);
  if (index === -1) return;

  const next = [...ordersCache];
  next[index] = { ...next[index], id: newId };
  ordersCache = next;

  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem("lastSubmittedOrder") === oldId) {
        sessionStorage.setItem("lastSubmittedOrder", newId);
      }
    } catch {
      // Storage unavailable — the toast just shows the pre-rename number.
    }
  }

  notifyOrderListeners();
}

// ---------------------------------------------------------------------------
// Backend sync (cross-device). The backend (Supabase) is the shared copy.
// All helpers fail silently offline — the portals keep working in memory.
// ---------------------------------------------------------------------------

import { apiGet, apiPatch, apiPost } from "./api";
import { getSessionStatus } from "./session";

/** Order row as returned by GET /api/orders (Supabase). */
export interface BackendOrderRow {
  id: string;
  order_no: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_reg_no: string | null;
  vehicle_model: string | null;
  delivery_address: string | null;
  items: SharedOrder["items"] | null;
  total: number | string | null;
  status: string | null;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string | null;
}

function displayDateOf(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function fromBackendRow(row: BackendOrderRow): SharedOrder {
  return normalizeOrder({
    id: row.order_no || `srv-${String(row.id).slice(0, 8)}`,
    customerName: row.customer_name ?? "",
    ownerId: row.owner_id ?? undefined,
    phoneNumber: row.phone ?? "",
    email: row.email ?? undefined,
    vehicleRegistrationNo: row.vehicle_reg_no ?? undefined,
    vehicleModel: row.vehicle_model ?? undefined,
    deliveryAddress: row.delivery_address ?? undefined,
    items: (Array.isArray(row.items) ? row.items : []) as SharedOrder["items"],
    totalAmount: Number(row.total) || 0,
    status: row.status as SharedOrder["status"],
    createdAt: row.created_at,
    date: displayDateOf(row.created_at),
    updatedAt: row.updated_at || row.created_at,
    notes: row.notes ?? undefined,
  });
}

/** Result of trying to persist an order on the backend. */
export interface PushedOrder {
  /** Number the order ended up with (backend may re-key on collision). */
  orderNo: string;
  /** True when the backend accepted it; false = local copy only. */
  ok: boolean;
  /** HTTP status of the attempt (0 when the server could not be reached). */
  status: number;
}

/**
 * Push an order to the backend shared copy.
 *
 * Resolves with the number it actually ended up with — when the requested
 * number was already taken by an unrelated order the backend mints a free
 * one, and we re-key locally so the next sync does not show it twice.
 * `ok` is false when nothing was persisted server-side.
 */
export function pushOrderToBackend(o: SharedOrder, createdBy?: string): Promise<PushedOrder> {
  const failed: PushedOrder = { orderNo: o.id, ok: false, status: 0 };
  return apiPost<BackendOrderRow>("/api/orders", {
    orderNo: o.id,
    customerName: o.customerName,
    phone: o.phoneNumber,
    email: o.email,
    vehicleRegNo: o.vehicleRegistrationNo,
    vehicleModel: o.vehicleModel,
    deliveryAddress: o.deliveryAddress,
    items: o.items,
    total: o.totalAmount,
    status: o.status,
    notes: o.notes,
    ownerId: o.ownerId,
    createdBy,
    createdAt: o.createdAt,
  })
    .then(({ ok, status, body }) => {
      if (!ok || !body) return { ...failed, status };
      const row = body.data;
      const finalNo = (row && String(row.order_no ?? "")) || o.id;
      if (finalNo !== o.id) renameOrderId(o.id, finalNo);
      return { orderNo: finalNo, ok: true, status };
    })
    .catch(() => failed); // Offline / backend down: kept in memory, merges later.
}

/** Fire-and-forget: sync a staff status move to the backend. */
export function pushOrderStatusToBackend(orderNo: string, status: string): void {
  if (typeof window === "undefined") return;
  const encoded = encodeURIComponent(orderNo);
  apiPatch(`/api/orders/by-no/${encoded}/status`, { status }).catch(() => {
    // Offline: kept in memory, retried on next status change.
  });
}

let ordersSyncAt = 0;
let ordersSyncInflight: Promise<boolean> | null = null;
const ORDERS_SYNC_TTL_MS = 30_000;
/** Failed pulls are retried soon instead of being held off for a full TTL. */
const ORDERS_SYNC_RETRY_MS = 5_000;

/**
 * Pull the backend shared copy and merge it into the in-memory cache.
 * Returns true when the view needs rebuilding (new rows, or rows another
 * device changed since this cache was built).
 *
 * Merging, rather than only appending unseen ids, is what makes status moves
 * from other devices land here — before, a row was fetched once and then
 * frozen locally forever. Rows this device has never pushed are kept, and a
 * local edit wins until the backend's `updated_at` overtakes its `updatedAt`.
 *
 * Deduped + 30s TTL so many components can call it. The TTL is only stamped
 * after a *successful* pull, so a backend that was down does not block every
 * page for the next 30s.
 */
export function syncOrdersFromBackend(force = false): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  // A signed-out tab can only ever get a 401 here. <AuthGuard/> is already
  // on its way to the login page, so stop asking until that resolves — this
  // is what used to fill the backend log every 20s.
  if (getSessionStatus() === "signed-out") return Promise.resolve(false);
  const now = Date.now();
  if (!force && now - ordersSyncAt < ORDERS_SYNC_TTL_MS) {
    return Promise.resolve(false);
  }
  if (ordersSyncInflight) return ordersSyncInflight;
  ordersSyncInflight = (async () => {
    let pulled = false;
    try {
      const { ok, body } = await apiGet<BackendOrderRow[]>("/api/orders");
      if (!ok || !body) return false;
      const rows = Array.isArray(body) ? body : body.data;
      if (!Array.isArray(rows)) return false;
      pulled = true;
      if (rows.length === 0) return false;

      const incoming = rows.map(fromBackendRow);
      const byId = new Map(incoming.map((o) => [o.id, o]));
      const merged: SharedOrder[] = [];
      const seen = new Set<string>();
      let changed = false;

      // 1. Keep this device's ordering, upgrading rows the backend has newer.
      for (const local of ordersCache) {
        const newer = byId.get(local.id);
        if (newer && isNewer(newer.updatedAt, local.updatedAt)) {
          merged.push(newer);
          changed = true;
        } else {
          merged.push(local);
        }
        seen.add(local.id);
      }

      // 2. Append orders created on other devices (API returns newest first).
      for (const o of incoming) {
        if (seen.has(o.id)) continue;
        merged.push(o);
        changed = true;
      }

      if (!changed) return false;
      // Newest first, so an order raised elsewhere lands at the top of the
      // list instead of after every row this device already held.
      ordersCache = merged.sort(byNewestFirst);
      notifyOrderListeners();
      return true;
    } catch {
      return false;
    } finally {
      ordersSyncAt = pulled
        ? Date.now()
        : Date.now() - ORDERS_SYNC_TTL_MS + ORDERS_SYNC_RETRY_MS;
      ordersSyncInflight = null;
    }
  })();
  return ordersSyncInflight;
}

/** True when `a` is a strictly newer edit than `b`. */
function isNewer(a?: string, b?: string): boolean {
  const at = a ? Date.parse(a) : NaN;
  const bt = b ? Date.parse(b) : NaN;
  if (Number.isNaN(at)) return false;
  if (Number.isNaN(bt)) return true;
  return at > bt;
}

/** Newest first. Rows with an unparseable date sort last but keep order. */
function byNewestFirst(a: SharedOrder, b: SharedOrder): number {
  const at = Date.parse(a.createdAt);
  const bt = Date.parse(b.createdAt);
  const av = Number.isNaN(at) ? 0 : at;
  const bv = Number.isNaN(bt) ? 0 : bt;
  return bv - av;
}

/**
 * Keep an open page fresh. Orders placed on another device only reach this
 * one through a sync, and the order pages used to sync once on mount — so a
 * staff member sitting on the list never saw the next order until they
 * reloaded.
 */
export function startOrdersPolling(intervalMs = 20_000): () => void {
  if (typeof window === "undefined") return () => {};
  const timer = setInterval(() => {
    syncOrdersFromBackend(true).catch(() => {});
  }, intervalMs);
  return () => clearInterval(timer);
}

/** Same-tab live sync: fires every time the shared store is written. */
export function subscribeOrders(listener: Listener): () => void {
  orderListeners.add(listener);
  return () => orderListeners.delete(listener);
}
