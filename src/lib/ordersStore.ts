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
