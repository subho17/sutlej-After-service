// Single source of truth for complaints (staff + customer).
//
// Background: staff read `staffComplaints` while the customer portal read
// `sutlej_customer_complaints`, so staff status updates never reached
// customers (and vice versa). Everything now goes through load/save below,
// which read + write ONE shared key and one-time migrate legacy keys.

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
  source?: string;
}

const SHARED_KEY = "sutlej_complaints";

// Legacy keys from before the unification (kept as mirrors for safety).
// Order matters for migration: later keys win, so the staff copy
// (which carries status updates) takes precedence.
const LEGACY_KEYS = ["sutlej_customer_complaints", "staffComplaints"] as const;

// Loose input shape: anything JSON-parsed or hand-built. The normalizer
// below coerces it into a SharedComplaint.
type RawComplaint = {
  id: unknown;
  [key: string]: unknown;
};

function asArray(value: unknown): RawComplaint[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (o): o is RawComplaint => typeof o === "object" && o !== null && "id" in o
  );
}

function readKey(key: string): RawComplaint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? asArray(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

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
    source: str(pick(raw, "source")) || undefined,
  };
}

/**
 * Load all complaints. First call migrates legacy keys into the shared key
 * (deduplicated by id — staff copy wins on conflicts).
 */
export function loadComplaints(): SharedComplaint[] {
  const shared = readKey(SHARED_KEY);
  if (shared.length > 0) return shared.map(normalizeComplaint);

  const merged = new Map<string, RawComplaint>();
  for (const key of LEGACY_KEYS) {
    for (const item of readKey(key)) merged.set(String(item.id ?? ""), item);
  }
  const items = [...merged.values()].map(normalizeComplaint);
  if (items.length > 0) persist(items);
  return items;
}

function persist(items: SharedComplaint[]): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(items);
    localStorage.setItem(SHARED_KEY, json);
    // Mirror to legacy keys for any old code paths still reading them.
    for (const key of LEGACY_KEYS) localStorage.setItem(key, json);
  } catch {
    // Ignore storage errors (private mode, quota).
  }
}

/** Save complaints — visible to BOTH staff and customer immediately. */
export function saveComplaints(items: SharedComplaint[]): void {
  persist(items.map(normalizeComplaint));
}

type Listener = () => void;

/**
 * Cross-tab live sync: fires in every OTHER open tab when this tab saves,
 * so the customer portal updates instantly without refresh.
 * (Same-tab updates already happen via setState on save.)
 */
export function subscribeComplaints(listener: Listener): () => void {
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
