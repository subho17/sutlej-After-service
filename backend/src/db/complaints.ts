import { supabaseAdmin } from "../config/supabase.js";
import type { ComplaintRow } from "./types.js";

export async function listComplaints(): Promise<ComplaintRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ComplaintRow[];
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
 * Portal write-through: upserts the localStorage complaint into Supabase
 * keyed by ticket_no, so every device sees it. Retries are idempotent.
 */
export async function upsertPortalComplaint(input: PortalComplaintInput): Promise<ComplaintRow> {
  const { data, error } = await supabaseAdmin()
    .from("complaints")
    .upsert(
      {
        ticket_no: input.ticketNo,
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
