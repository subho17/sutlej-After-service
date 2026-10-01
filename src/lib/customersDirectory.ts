// Staff-side customer directory, aggregated from local data.
//
// One entry per customer (keyed by phone, falling back to name), combining:
// - complaints (their tickets + statuses)
// - orders (their purchases + total spent)
// - vehicle registration numbers seen across both
// - activity history (newest first)
//
// NOTE (same-browser scope): this reflects data present in the STAFF
// browser's shared stores. True cross-device profiles need the backend
// (Phase 2/3) — until then, customer-portal entries appear here once this
// browser has synced them (open both portals in this browser once).

import { loadComplaints, type SharedComplaint } from "./complaintsStore";
import { loadOrders, type SharedOrder } from "./ordersStore";

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

  const entryFor = (name: string, phone: string): DirectoryCustomer => {
    const key = digits(phone) || `name:${name.trim().toLowerCase()}`;
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
    const e = entryFor(c.customerName, c.phoneNumber);
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
    const e = entryFor(o.customerName, o.phoneNumber);
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
