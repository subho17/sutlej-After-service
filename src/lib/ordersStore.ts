// Single source of truth for spare-part orders (staff + customer).
//
// Background: staff wrote `staffSparePartOrders` while the customer portal
// read `sutlej_customer_orders`, so staff status updates (Delivered, …)
// never appeared for customers. Everything now goes through load/save
// below, which read + write ONE shared key and one-time migrate legacy keys.

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

const SHARED_KEY = "sutlej_spare_orders";

// Legacy keys from before the unification (kept as mirrors for safety).
// Order matters for migration: later keys win, so the staff copy
// (which carries status updates) takes precedence.
const LEGACY_KEYS = [
  "customerOrders",
  "sutlej_customer_orders",
  "staffSparePartOrders",
] as const;

type RawOrder = Partial<SharedOrder> & { id: string };

function asArray(value: unknown): RawOrder[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (o): o is RawOrder => typeof o === "object" && o !== null && "id" in o
  );
}

function readKey(key: string): RawOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? asArray(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

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

/**
 * Load all orders. First call migrates legacy keys into the shared key
 * (deduplicated by id — later keys win, so staff edits take precedence).
 */
export function loadOrders(): SharedOrder[] {
  const shared = readKey(SHARED_KEY);
  if (shared.length > 0) return shared.map(normalizeOrder);

  const merged = new Map<string, RawOrder>();
  for (const key of LEGACY_KEYS) {
    for (const order of readKey(key)) merged.set(order.id, order);
  }
  const orders = [...merged.values()].map(normalizeOrder);
  if (orders.length > 0) persist(orders);
  return orders;
}

function persist(orders: SharedOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(orders);
    localStorage.setItem(SHARED_KEY, json);
    // Mirror to legacy keys for any old code paths still reading them.
    for (const key of LEGACY_KEYS) localStorage.setItem(key, json);
  } catch {
    // Ignore storage errors (private mode, quota).
  }
}

/** Save orders — visible to BOTH staff and customer immediately. */
export function saveOrders(orders: SharedOrder[]): void {
  persist(orders.map(normalizeOrder));
}

// ---------------------------------------------------------------------------
// Backend sync (cross-device). Local storage stays the interactive source of
// truth; the backend (Supabase) is the shared copy every device merges.
// All helpers fail silently offline — the portals keep working locally.
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
    // Offline / backend down: stays local, merges later.
  });
}

/** Fire-and-forget: sync a staff status move to the backend. */
export function pushOrderStatusToBackend(orderNo: string, status: string): void {
  if (typeof window === "undefined") return;
  const encoded = encodeURIComponent(orderNo);
  apiPatch(`/api/orders/by-no/${encoded}/status`, { status }).catch(() => {
    // Offline: stays local, retried on next status change.
  });
}

let ordersSyncAt = 0;
let ordersSyncInflight: Promise<boolean> | null = null;
const ORDERS_SYNC_TTL_MS = 30_000;

/**
 * Pull the backend shared copy and union it into localStorage.
 * Local rows win on id conflict. Returns true when new rows arrived.
 * Deduped + 30s TTL so many components can call it.
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
      const seen = new Set(loadOrders().map((o) => o.id));
      const incoming = rows.map(fromBackendRow).filter((o) => !seen.has(o.id));
      if (incoming.length === 0) return false;
      saveOrders([...loadOrders(), ...incoming]);
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

type Listener = () => void;

/**
 * Cross-tab live sync: fires in every OTHER open tab when this tab saves,
 * so the other portal updates instantly without refresh.
 * (Same-tab updates already happen via setState on save.)
 */
export function subscribeOrders(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (
      e.key === null ||
      e.key === SHARED_KEY ||
      (LEGACY_KEYS as readonly string[]).includes(e.key)
    ) {
      listener();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
