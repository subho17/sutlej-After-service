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
