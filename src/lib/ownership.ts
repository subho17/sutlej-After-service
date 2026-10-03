// Per-account ownership for portal data (complaints, orders, vehicles).
//
// Background: the shared localStorage stores had no owner info, so every
// logged-in user saw every other user's complaints/orders/vehicles. Records
// now carry the author's account id; readers below filter to it.
//
// Rules (deliberately forgiving so no existing data disappears):
// - Logged-out visitors (no session) see everything (demo browsing).
// - Logged-in users see: their own records (ownerId match) + legacy
//   records with no owner that carry their display name.
// - The staff portal never filters (staff sees all).

import { apiGet } from "./api";

export interface OwnedRecord {
  ownerId?: string;
  customerName?: string;
}

export function currentCustomer(): { id: string | null; name: string | null } {
  if (typeof window === "undefined") return { id: null, name: null };
  return {
    id: sessionStorage.getItem("customerId"),
    name: sessionStorage.getItem("customerName"),
  };
}

/** Account id of the logged-in customer (null when logged out/demo). */
export function currentCustomerId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("customerId");
}

export function canSeeRecord(record: OwnedRecord): boolean {
  const { id, name } = currentCustomer();
  if (!id && !name) return true; // logged-out demo browsing
  if (id && record.ownerId === id) return true;
  if (!record.ownerId && name && record.customerName === name) return true;
  return false;
}

export function visibleRecords<T extends OwnedRecord>(records: T[]): T[] {
  return records.filter(canSeeRecord);
}

// ---------------------------------------------------------------------------
// The signed-in customer's session + their own phone number.
//
// Every complaint used to be stamped with one hard-coded number, so staff saw
// the same phone for every customer. The real number comes from the account:
// it is cached in sessionStorage at login/signup, and sessions opened before
// that (or in another tab) fetch it from the backend profile once.
// ---------------------------------------------------------------------------

interface CustomerProfile {
  name?: string | null;
  customerId?: string | null;
  phone?: string | null;
}

export type CustomerSessionState =
  /** A live customer cookie on this browser. */
  | "signed-in"
  /** No valid customer session — this browser cannot raise complaints. */
  | "signed-out"
  /** Backend not answering; the caller decides whether to proceed. */
  | "unreachable";

export interface CustomerSession {
  state: CustomerSessionState;
  /** This customer's own number ("" when there is none to be found). */
  phone: string;
}

/** Phone stored at login, or "" when this session has none yet. */
export function cachedCustomerPhone(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem("customerPhone") ?? "";
  } catch {
    return "";
  }
}

/**
 * Confirm this browser really has a live customer session, and pick up the
 * account's own profile while we are there.
 *
 * `sessionStorage.customerId` alone cannot answer this: the auth cookie is
 * httpOnly, it may have been cleared, and a newly opened tab has the cookie
 * but none of the sessionStorage keys. So ask the backend once — a complaint
 * raised without a session is never persisted server-side, and the form used
 * to show a "success" message for one that never reached anyone.
 */
export async function verifyCustomerSession(): Promise<CustomerSession> {
  const cachedPhone = cachedCustomerPhone();
  if (typeof window === "undefined") return { state: "signed-out", phone: "" };

  let response;
  try {
    response = await apiGet<CustomerProfile>("/api/customers/me");
  } catch {
    // Backend unreachable — we cannot claim either way.
    return { state: "unreachable", phone: cachedPhone };
  }

  const { ok, status, body } = response;
  if (ok && body?.data) {
    const profile = body.data;
    try {
      if (profile.name) sessionStorage.setItem("customerName", profile.name);
      if (profile.customerId) sessionStorage.setItem("customerId", profile.customerId);
      if (profile.phone) sessionStorage.setItem("customerPhone", profile.phone);
    } catch {
      // Storage blocked: still usable for this call.
    }
    return {
      state: "signed-in",
      phone: String(profile.phone ?? "").trim(),
    };
  }

  if (status === 401 || status === 403 || status === 404) {
    return { state: "signed-out", phone: cachedPhone };
  }
  return { state: "unreachable", phone: cachedPhone };
}

