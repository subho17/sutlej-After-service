// Staff-side customer directory, aggregated from local data + backend.
//
// Complaints/orders (in-memory, synced from Supabase) are merged with the
// backend customer list (GET /api/customers, Supabase), so staff on ANY
// device/browser see every registered customer.

import { loadComplaints, type SharedComplaint } from "./complaintsStore";
import { loadOrders, type SharedOrder } from "./ordersStore";
import { apiGet } from "./api";

export interface CustomerHistoryEvent {
  date: string; // display date
  sortKey: number; // epoch ms (0 when unparseable → sorts last)
  text: string;
  kind: "complaint" | "order";
  status: string;
}

export interface DirectoryCustomer {
  /** Stable lookup key: digits-only phone, else `name:<lowercased name>`. */
  key: string;
  name: string;
  phone: string;
  email?: string;
  vehicleRegNos: string[];
  complaints: SharedComplaint[];
  openComplaints: number;
  orders: SharedOrder[];
  totalSpent: number;
  history: CustomerHistoryEvent[];
  lastActive: string;
}

function digits(v: string): string {
  return v.replace(/\D/g, "");
}

/** Stable lookup key shared by local + backend entries. */
export function directoryKeyFor(name: string, phone: string): string {
  return digits(phone || "") || `name:${(name || "").trim().toLowerCase()}`;
}

function parseTime(v: string): number {
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
}

function displayDate(isoOrDisplay: string): string {
  const t = parseTime(isoOrDisplay);
  if (!t) return isoOrDisplay;
  return new Date(t).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildCustomerDirectory(): DirectoryCustomer[] {
  const complaints = loadComplaints();
  const orders = loadOrders();

  const map = new Map<string, DirectoryCustomer>();
  const lastSeen = new Map<string, number>();

  const entryFor = (name: string, phone: string, ownerId?: string): DirectoryCustomer => {
    // Group by account id when available so two customers sharing the
    // same (or default) phone number never merge into one profile.
    const key = ownerId ? `uid:${ownerId}` : directoryKeyFor(name, phone);
    let entry = map.get(key);
    if (!entry) {
      entry = {
        key,
        name: name || "Walk-in customer",
        phone,
        vehicleRegNos: [],
        complaints: [],
        openComplaints: 0,
        orders: [],
        totalSpent: 0,
        history: [],
        lastActive: "",
      };
      map.set(key, entry);
      lastSeen.set(key, 0);
    }
    if (name && name.length > entry.name.length) entry.name = name;
    if (phone && !entry.phone) entry.phone = phone;
    return entry;
  };

  const touch = (entry: DirectoryCustomer, isoOrDisplay: string) => {
    const t = parseTime(isoOrDisplay);
    if (t >= (lastSeen.get(entry.key) ?? 0)) {
      lastSeen.set(entry.key, t);
      entry.lastActive = displayDate(isoOrDisplay);
    }
  };

  for (const c of complaints) {
    const e = entryFor(c.customerName, c.phoneNumber, c.ownerId);
    if (c.email && !e.email) e.email = c.email;
    e.complaints.push(c);
    if (c.status === "open" || c.status === "pending" || c.status === "in-progress") {
      e.openComplaints += 1;
    }
    for (const reg of [c.vehicleRegistrationNo]) {
      const r = reg.trim().toUpperCase();
      if (r && !e.vehicleRegNos.includes(r)) e.vehicleRegNos.push(r);
    }
    const t = parseTime(c.createdAt) || parseTime(c.date);
    e.history.push({
      date: c.date || c.createdAt,
      sortKey: t,
      text: `Complaint ${c.id} raised (${c.category || "General"})`,
      kind: "complaint",
      status: c.status,
    });
    touch(e, c.createdAt || c.date);
  }

  for (const o of orders) {
    const e = entryFor(o.customerName, o.phoneNumber, o.ownerId);
    if (o.email && !e.email) e.email = o.email;
    e.orders.push(o);
    e.totalSpent += Number(o.totalAmount) || 0;
    for (const reg of [o.vehicleRegistrationNo]) {
      const r = (reg || "").trim().toUpperCase();
      if (r && !e.vehicleRegNos.includes(r)) e.vehicleRegNos.push(r);
    }
    const t = parseTime(o.createdAt) || parseTime(o.date);
    const count = o.items.reduce((n, it) => n + (Number(it.quantity) || 0), 0);
    e.history.push({
      date: o.date || o.createdAt,
      sortKey: t,
      text: `Order ${o.id} placed — ${count} item${count === 1 ? "" : "s"} (₹${Number(o.totalAmount).toLocaleString("en-IN")})`,
      kind: "order",
      status: o.status,
    });
    touch(e, o.createdAt || o.date);
  }

  const list = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const e of list) e.history.sort((a, b) => b.sortKey - a.sortKey);
  return list;
}

export function findDirectoryCustomer(key: string): DirectoryCustomer | null {
  return buildCustomerDirectory().find((c) => c.key === key) ?? null;
}

/** Customer row as returned by GET /api/customers (Supabase). */
export interface BackendCustomer {
  id: string;
  name: string;
  customer_id?: string | null;
  phone: string;
  email?: string | null;
  created_at?: string;
}

/** Fetch registered customers from the backend (empty when unreachable). */
export async function fetchBackendCustomers(): Promise<BackendCustomer[]> {
  try {
    const { ok, body } = await apiGet<BackendCustomer[]>("/api/customers");
    if (!ok || !body) return [];
    const arr = Array.isArray(body) ? body : body.data;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Union of local activity entries + backend-registered customers.
 * Backend-only customers appear with empty complaints/orders so every
 * device shows the full list.
 */
export function mergeBackendCustomers(
  local: DirectoryCustomer[],
  remote: BackendCustomer[]
): DirectoryCustomer[] {
  const map = new Map<string, DirectoryCustomer>(local.map((c) => [c.key, c]));
  for (const r of remote) {
    const key = directoryKeyFor(r.name ?? "", r.phone ?? "");
    const existing = map.get(key);
    if (existing) {
      if (r.email && !existing.email) existing.email = r.email;
      continue;
    }
    map.set(key, {
      key,
      name: r.name || "Walk-in customer",
      phone: r.phone ?? "",
      email: r.email ?? undefined,
      vehicleRegNos: [],
      complaints: [],
      openComplaints: 0,
      orders: [],
      totalSpent: 0,
      history: [],
      lastActive: r.created_at ? displayDate(r.created_at) : "",
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Directory lookup across local + backend customers. */
export function findMergedDirectoryCustomer(
  key: string,
  remote: BackendCustomer[] = []
): DirectoryCustomer | null {
  return (
    mergeBackendCustomers(buildCustomerDirectory(), remote).find(
      (c) => c.key === key
    ) ?? null
  );
}
