import { supabaseAdmin } from "../config/supabase.js";
import type { ComplaintRow } from "./types.js";

/**
 * The portal used to stamp one hard-coded phone number on every complaint it
 * created, so staff saw the same number for every customer. The registered
 * customer's own phone is the source of truth: rows are matched back to the
 * account they belong to and re-read from `customers`. Email / name are only
 * filled in when the complaint has none.
 *
 * Matching cascade (most to least reliable):
 *   1. owner_id — the complaint was raised from a signed-in session.
 *   2. email    — staff typed the customer's registered email.
 *   3. name     — only when exactly one account carries that name, so two
 *                 "R. Sharma"s can never borrow each other's number.
 *
 * Applied on read, so existing rows display correctly without a migration.
 */
async function withRegisteredCustomerContact(
  rows: ComplaintRow[]
): Promise<ComplaintRow[]> {
  const unresolved = rows.filter(
    (row) => !row.owner_id || !row.phone || !row.email
  );
  if (unresolved.length === 0) return rows;

  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("customer_id, phone, email, name");

  if (error || !data || data.length === 0) return rows;

  interface Contact {
    customerId: string;
    phone: string | null;
    email: string | null;
    name: string | null;
  }

  const contacts: Contact[] = data.map((c) => ({
    customerId: String(c.customer_id ?? ""),
    phone: (c.phone as string | null) ?? null,
    email: (c.email as string | null) ?? null,
    name: (c.name as string | null) ?? null,
  }));

  const byId = new Map<string, Contact>();
  const byEmail = new Map<string, Contact>();
  const byName = new Map<string, Contact>();
  const nameCounts = new Map<string, number>();
  for (const contact of contacts) {
    if (contact.customerId) byId.set(contact.customerId, contact);
    if (contact.email) byEmail.set(contact.email.trim().toLowerCase(), contact);
    if (contact.name) {
      const key = contact.name.trim().toLowerCase();
      nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
      byName.set(key, contact);
    }
  }

  return rows.map((row) => {
    let contact: Contact | undefined = row.owner_id
      ? byId.get(String(row.owner_id))
      : undefined;
    if (!contact && row.email) {
      contact = byEmail.get(row.email.trim().toLowerCase());
    }
    if (!contact && row.customer_name) {
      const key = row.customer_name.trim().toLowerCase();
      if ((nameCounts.get(key) ?? 0) === 1) contact = byName.get(key);
    }
    if (!contact) return row;

    return {
      ...row,
      phone: contact.phone ?? row.phone,
      email: row.email ?? contact.email,
      customer_name: row.customer_name ?? contact.name,
    };
  });
}

export async function listComplaints(): Promise<ComplaintRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return withRegisteredCustomerContact((data ?? []) as ComplaintRow[]);
}

export async function createComplaint(input: {
  title: string;
  description: string;
  createdBy?: string;
}): Promise<ComplaintRow> {
  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .insert({
      title: input.title,
      description: input.description,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ComplaintRow;
}

export interface PortalComplaintInput {
  ticketNo: string;
  title: string;
  description: string;
  customerName?: string;
  phone?: string;
  email?: string;
  vehicleRegNo?: string;
  vehicleModel?: string;
  category?: string;
  priority?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: string;
}

const COMPLAINT_STATUSES = ["pending", "open", "in-progress", "resolved", "closed"] as const;

function normalizeStatus(value: unknown): (typeof COMPLAINT_STATUSES)[number] {
  const v = String(value ?? "open").trim().toLowerCase().replace(/\s+/g, "-");
  return (COMPLAINT_STATUSES as readonly string[]).includes(v)
    ? (v as (typeof COMPLAINT_STATUSES)[number])
    : "open";
}

function normalizePriority(value: unknown): string {
  const v = String(value ?? "Medium").trim();
  if (/^critical/i.test(v)) return "Critical";
  if (/^high/i.test(v)) return "High";
  if (/^low/i.test(v)) return "Low";
  return "Medium";
}

/**
 * Is `existing` the same complaint as `input`, i.e. is an upsert a safe
 * retry rather than a different ticket that happens to share a number?
 *
 * Clients stamp `createdAt` on every complaint and resend it unchanged on a
 * retry, so matching timestamps means "same row". Without a usable timestamp
 * we fall back to the content identity (owner + customer + description).
 */
function isSameComplaint(existing: ComplaintRow, input: PortalComplaintInput): boolean {
  const incomingAt = Date.parse(input.createdAt ?? "");
  if (!Number.isNaN(incomingAt)) {
    const existingAt = Date.parse(existing.created_at ?? "");
    if (!Number.isNaN(existingAt)) return existingAt === incomingAt;
  }

  return (
    (existing.owner_id ?? null) === (input.ownerId ?? null) &&
    (existing.customer_name ?? null) === (input.customerName ?? null) &&
    existing.description === input.description
  );
}

/**
 * Next free ticket for the requested number's shape: `SA-2026-0003` →
 * `SA-2026-0004`, taking the highest existing suffix into account so a gap
 * is never re-issued while another row still holds it.
 */
async function nextFreeTicketNo(requested: string): Promise<string> {
  const match = /^(.*?)(\d+)$/.exec(requested);
  const prefix = match ? match[1] : `${requested}-`;
  const width = match ? match[2].length : 4;
  let highest = match ? parseInt(match[2], 10) : 0;

  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .select("ticket_no")
    .not("ticket_no", "is", null);

  if (error) throw error;

  const taken = new Set<string>();
  for (const row of data ?? []) {
    const ticket = String((row as { ticket_no: string | null }).ticket_no ?? "");
    if (!ticket) continue;
    taken.add(ticket);
    if (!ticket.startsWith(prefix)) continue;
    const tail = ticket.slice(prefix.length);
    if (!/^\d+$/.test(tail)) continue;
    const suffix = parseInt(tail, 10);
    if (suffix > highest) highest = suffix;
  }

  for (let n = highest + 1; ; n++) {
    const candidate = `${prefix}${String(n).padStart(width, "0")}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Portal write-through: upserts the portal complaint into Supabase keyed by
 * ticket_no, so every device sees it. Retries are idempotent.
 *
 * Guards against the ID-collision data loss the portals used to hit: ticket
 * numbers were generated from a browser's local row count, so a device with
 * an empty cache minted `SA-2026-0001` again and the upsert silently replaced
 * an unrelated complaint. When the number is already held by a *different*
 * complaint, this mints a fresh number instead of overwriting, and the caller
 * adopts the returned ticket.
 */
export async function upsertPortalComplaint(input: PortalComplaintInput): Promise<ComplaintRow> {
  let ticketNo = input.ticketNo;

  const { data: existing, error: lookupError } = await supabaseAdmin()
    .from("complaints")
    .select("*")
    .eq("ticket_no", ticketNo)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing && !isSameComplaint(existing as ComplaintRow, input)) {
    ticketNo = await nextFreeTicketNo(ticketNo);
  }

  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .upsert(
      {
        ticket_no: ticketNo,
        title: input.title,
        description: input.description,
        customer_name: input.customerName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        vehicle_reg_no: input.vehicleRegNo ?? null,
        vehicle_model: input.vehicleModel ?? null,
        category: input.category ?? null,
        priority: normalizePriority(input.priority),
        status: normalizeStatus(input.status),
        source: input.source ?? null,
        owner_id: input.ownerId ?? null,
        created_by: input.createdBy ?? null,
        ...(input.createdAt ? { created_at: input.createdAt } : {}),
      },
      { onConflict: "ticket_no" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ComplaintRow;
}

/** Staff status moves sync back to Supabase (no-op when ticket unknown). */
export async function updatePortalComplaintStatus(
  ticketNo: string,
  status: string
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("complaints")
    .update({ status: normalizeStatus(status) })
    .eq("ticket_no", ticketNo);

  if (error) throw error;
}
