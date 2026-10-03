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
  ordersCache = orders.map(normalizeOrder);
  notifyOrderListeners();
}

// ---------------------------------------------------------------------------
// Backend sync (cross-device). The backend (Supabase) is the shared copy.
// All helpers fail silently offline — the portals keep working in memory.
// ---------------------------------------------------------------------------

import { apiGet, apiPatch, apiPost } from "./api";

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
    notes: row.notes ?? undefined,
  });
}

/** Fire-and-forget: push an order to the backend shared copy. */
export function pushOrderToBackend(o: SharedOrder, createdBy?: string): void {
  apiPost("/api/orders", {
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
  }).catch(() => {
    // Offline / backend down: kept in memory, merges later.
  });
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

/**
 * Pull the backend shared copy and merge it into the in-memory cache.
 * Local rows win on id conflict (local is the interactive copy). Returns
 * true when new rows arrived. Deduped + 30s TTL so many can call it.
 */
export function syncOrdersFromBackend(force = false): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const now = Date.now();
  if (!force && now - ordersSyncAt < ORDERS_SYNC_TTL_MS) {
    return Promise.resolve(false);
  }
  if (ordersSyncInflight) return ordersSyncInflight;
  ordersSyncInflight = (async () => {
    try {
      const { ok, body } = await apiGet<BackendOrderRow[]>("/api/orders");
      if (!ok || !body) return false;
      const rows = Array.isArray(body) ? body : body.data;
      if (!Array.isArray(rows) || rows.length === 0) return false;
      const seen = new Set(ordersCache.map((o) => o.id));
      const incoming = rows.map(fromBackendRow).filter((o) => !seen.has(o.id));
      if (incoming.length === 0) return false;
      ordersCache = [...ordersCache, ...incoming];
      notifyOrderListeners();
      return true;
    } catch {
      return false;
    } finally {
      ordersSyncAt = Date.now();
      ordersSyncInflight = null;
    }
  })();
  return ordersSyncInflight;
}

/** Same-tab live sync: fires every time the shared store is written. */
export function subscribeOrders(listener: Listener): () => void {
  orderListeners.add(listener);
  return () => orderListeners.delete(listener);
}
