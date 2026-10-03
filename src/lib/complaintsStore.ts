// Single source of truth for complaints (staff + customer).
//
// No localStorage: the in-memory cache below is the interactive source of
// truth, and the backend (Supabase) is the shared copy every device syncs
// with. On a fresh load the cache is populated by syncComplaintsFromBackend().

export type ComplaintStatus = "pending" | "open" | "in-progress" | "resolved" | "closed";

export interface SharedComplaint {
  id: string;
  title: string;
  description: string;
  customerName: string;
  /** Account id of the customer who raised it (missing on legacy rows). */
  ownerId?: string;
  phoneNumber: string;
  /** Customer email for status-update emails (optional). */
  email?: string;
  vehicleRegistrationNo: string;
  model: string;
  category: string;
  priority: string;
  status: ComplaintStatus;
  date: string;
  createdAt: string;
  /** Last edit time (local or from Supabase). Drives the sync merge. */
  updatedAt?: string;
  source?: string;
}

// Loose input shape: anything JSON-parsed or hand-built. The normalizer
// below coerces it into a SharedComplaint.
type RawComplaint = {
  id: unknown;
  [key: string]: unknown;
};

function canonicalStatus(value: unknown): ComplaintStatus {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "pending" || v === "awaiting") return "pending";
  if (v === "in progress" || v === "in-progress") return "in-progress";
  if (v === "resolved") return "resolved";
  if (v === "closed") return "closed";
  return "open";
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Read an optional key that only exists on loose (un-normalized) inputs. */
function pick(raw: RawComplaint | SharedComplaint, key: string): unknown {
  return key in raw ? (raw as RawComplaint)[key] : undefined;
}

/** Fill missing fields so staff- and customer-shaped complaints both render. */
export function normalizeComplaint(raw: RawComplaint | SharedComplaint): SharedComplaint {
  const date =
    str(raw.date) ||
    str(raw.createdAt) ||
    new Date().toISOString();
  const vehicle = str(raw.vehicleRegistrationNo);
  const category = str(raw.category) || "Other";
  const phone = str(raw.phoneNumber) || str(pick(raw, "phone"));
  return {
    id: String(raw.id ?? ""),
    title: str(raw.title) || `${category} - ${vehicle}`.trim(),
    description: str(raw.description),
    customerName: str(raw.customerName),
    ownerId: str(pick(raw, "ownerId")) || undefined,
    phoneNumber: phone,
    email: str(pick(raw, "email")) || undefined,
    vehicleRegistrationNo: vehicle,
    model: str(raw.model),
    category,
    priority: str(raw.priority) || "Medium",
    status: canonicalStatus(raw.status),
    date,
    createdAt: str(raw.createdAt) || date,
    updatedAt: str(pick(raw, "updatedAt")) || undefined,
    source: str(pick(raw, "source")) || undefined,
  };
}

// ---------------------------------------------------------------------------
// In-memory cache + same-tab listeners
// ---------------------------------------------------------------------------

let complaintsCache: SharedComplaint[] = [];
type Listener = () => void;
const complaintListeners = new Set<Listener>();

function notifyComplaintListeners(): void {
  for (const listener of complaintListeners) listener();
}

/** Load all complaints (in-memory; populated by backend sync). */
export function loadComplaints(): SharedComplaint[] {
  return complaintsCache;
}

/** Save complaints — visible to BOTH staff and customer immediately. */
export function saveComplaints(items: SharedComplaint[]): void {
  complaintsCache = items.map(normalizeComplaint);
  notifyComplaintListeners();
}

/**
 * Next unused ticket number, derived from the highest suffix already held
 * instead of `cache.length + 1`.
 *
 * The count-based formula is what made complaints disappear: a device whose
 * cache had not synced yet minted `SA-2026-0001` again, the backend upsert
 * keyed on ticket_no replaced the existing row, and the third complaint
 * silently overwrote the first. The backend still mints a free number if a
 * race slips through — this just stops the collision happening at source.
 */
export function nextComplaintTicketNo(prefix = "SA-2026-"): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const shape = new RegExp(`^${escaped}(\\d+)$`);

  const taken = new Set<string>();
  let highest = 0;
  for (const complaint of complaintsCache) {
    taken.add(complaint.id);
    const match = shape.exec(complaint.id);
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
 * Re-key a local complaint when the backend assigned it a different ticket
 * (it found the requested number already held by an unrelated complaint).
 * Keeps this device, the backend and the success toast agreeing on one id.
 */
export function renameComplaintId(oldId: string, newId: string): void {
  if (!newId || oldId === newId) return;
  const index = complaintsCache.findIndex((c) => c.id === oldId);
  if (index === -1) return;

  const next = [...complaintsCache];
  next[index] = { ...next[index], id: newId };
  complaintsCache = next;

  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem("lastSubmittedComplaint") === oldId) {
        sessionStorage.setItem("lastSubmittedComplaint", newId);
      }
    } catch {
      // Storage unavailable — the toast just shows the pre-rename ticket.
    }
  }

  notifyComplaintListeners();
}

// ---------------------------------------------------------------------------
// Backend sync (cross-device). The backend (Supabase) is the shared copy.
// All helpers fail silently offline — the portals keep working in memory.
// ---------------------------------------------------------------------------

import { apiGet, apiPatch, apiPost } from "./api";
import { getSessionStatus } from "./session";

/** Complaint row as returned by GET /api/complaints (Supabase). */
export interface BackendComplaintRow {
  id: string;
  ticket_no: string | null;
  title: string;
  description: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_reg_no: string | null;
  vehicle_model: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  source: string | null;
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

function fromBackendRow(row: BackendComplaintRow): SharedComplaint {
  return normalizeComplaint({
    id: row.ticket_no || `srv-${String(row.id).slice(0, 8)}`,
    title: row.title,
    description: row.description,
    customerName: row.customer_name,
    ownerId: row.owner_id,
    phoneNumber: row.phone,
    email: row.email,
    vehicleRegistrationNo: row.vehicle_reg_no,
    model: row.vehicle_model,
    category: row.category,
    priority: row.priority,
    status: row.status,
    date: displayDateOf(row.created_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    source: row.source,
  } as RawComplaint);
}

/** Result of trying to persist a complaint on the backend. */
export interface PushedComplaint {
  /** Ticket the complaint ended up with (backend may re-key on collision). */
  ticket: string;
  /** True when the backend accepted it; false = local copy only. */
  ok: boolean;
  /** HTTP status of the attempt (0 when the server could not be reached). */
  status: number;
}

/**
 * Push a complaint to the backend shared copy.
 *
 * Resolves with the ticket it actually ended up with — when the requested
 * number was already taken by an unrelated complaint the backend mints a free
 * one, and we re-key locally so the next sync does not show the same ticket
 * twice. `ok` is false when nothing was persisted server-side, so the caller
 * can say so instead of reporting a success that never happened.
 */
export function pushComplaintToBackend(c: SharedComplaint): Promise<PushedComplaint> {
  const failed: PushedComplaint = { ticket: c.id, ok: false, status: 0 };
  return apiPost<BackendComplaintRow>("/api/complaints/portal", {
    ticketNo: c.id,
    title: c.title,
    description: c.description,
    customerName: c.customerName,
    phone: c.phoneNumber,
    email: c.email,
    vehicleRegNo: c.vehicleRegistrationNo,
    vehicleModel: c.model,
    category: c.category,
    priority: c.priority,
    status: c.status,
    source: c.source,
    ownerId: c.ownerId,
    createdAt: c.createdAt,
  })
    .then(({ ok, status, body }) => {
      if (!ok) return { ...failed, status };
      const finalTicket = String(body?.data?.ticket_no ?? "") || c.id;
      if (finalTicket !== c.id) renameComplaintId(c.id, finalTicket);
      return { ticket: finalTicket, ok: true, status };
    })
    .catch(() => failed);
}

/** Fire-and-forget: sync a staff status move to the backend. */
export function pushComplaintStatusToBackend(ticketNo: string, status: string): void {
  if (typeof window === "undefined") return;
  const encoded = encodeURIComponent(ticketNo);
  apiPatch(`/api/complaints/by-ticket/${encoded}/status`, { status }).catch(() => {
    // Offline: kept in memory, retried on next status change.
  });
}

let complaintsSyncAt = 0;
let complaintsSyncInflight: Promise<boolean> | null = null;
const COMPLAINTS_SYNC_TTL_MS = 30_000;
/** Failed pulls are retried soon instead of being held off for a full TTL. */
const COMPLAINTS_SYNC_RETRY_MS = 5_000;

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
export function syncComplaintsFromBackend(force = false): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  // A signed-out tab can only ever get a 401 here. <AuthGuard/> is already
  // on its way to the login page, so stop asking until that resolves — this
  // is what used to fill the backend log every 20s.
  if (getSessionStatus() === "signed-out") return Promise.resolve(false);
  const now = Date.now();
  if (!force && now - complaintsSyncAt < COMPLAINTS_SYNC_TTL_MS) {
    return Promise.resolve(false);
  }
  if (complaintsSyncInflight) return complaintsSyncInflight;
  complaintsSyncInflight = (async () => {
    let pulled = false;
    try {
      const { ok, body } = await apiGet<BackendComplaintRow[]>("/api/complaints");
      if (!ok || !body) return false;
      const rows = Array.isArray(body) ? body : body.data;
      if (!Array.isArray(rows)) return false;
      pulled = true;
      if (rows.length === 0) return false;

      const incoming = rows.map(fromBackendRow);
      const byId = new Map(incoming.map((c) => [c.id, c]));
      const merged: SharedComplaint[] = [];
      const seen = new Set<string>();
      let changed = false;

      // 1. Keep this device's ordering, upgrading rows the backend has newer.
      for (const local of complaintsCache) {
        const newer = byId.get(local.id);
        if (newer && isNewer(newer.updatedAt, local.updatedAt)) {
          merged.push(newer);
          changed = true;
        } else {
          merged.push(local);
        }
        seen.add(local.id);
      }

      // 2. Append complaints created on other devices (API returns newest first).
      for (const c of incoming) {
        if (seen.has(c.id)) continue;
        merged.push(c);
        changed = true;
      }

      if (!changed) return false;
      // Newest first, so a complaint raised elsewhere lands at the top of the
      // list instead of after every row this device already held.
      complaintsCache = merged.sort(byNewestFirst);
      notifyComplaintListeners();
      return true;
    } catch {
      return false;
    } finally {
      complaintsSyncAt = pulled
        ? Date.now()
        : Date.now() - COMPLAINTS_SYNC_TTL_MS + COMPLAINTS_SYNC_RETRY_MS;
      complaintsSyncInflight = null;
    }
  })();
  return complaintsSyncInflight;
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
function byNewestFirst(a: SharedComplaint, b: SharedComplaint): number {
  const at = Date.parse(a.createdAt);
  const bt = Date.parse(b.createdAt);
  const av = Number.isNaN(at) ? 0 : at;
  const bv = Number.isNaN(bt) ? 0 : bt;
  return bv - av;
}

/**
 * Keep an open page fresh. Complaints raised on another device only reach
 * this one through a sync, and the components used to sync once on mount —
 * so a staff member sitting on the list never saw the next complaint until
 * they reloaded.
 */
export function startComplaintsPolling(intervalMs = 20_000): () => void {
  if (typeof window === "undefined") return () => {};
  const timer = setInterval(() => {
    syncComplaintsFromBackend(true).catch(() => {});
  }, intervalMs);
  return () => clearInterval(timer);
}

/** Same-tab live sync: fires every time the shared store is written. */
export function subscribeComplaints(listener: Listener): () => void {
  complaintListeners.add(listener);
  return () => complaintListeners.delete(listener);
}
