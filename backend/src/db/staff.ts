import { supabaseAdmin } from "../config/supabase.js";
import type { StaffRow } from "./types.js";

export async function findStaffByIdentifier(identifier: string): Promise<StaffRow | null> {
  const idLower = identifier.toLowerCase();
  const { data, error } = await supabaseAdmin()
    .from("staff")
    .select("*")
    .or(
      `staff_id.eq.${identifier},username.eq.${identifier},email.eq.${idLower},phone.eq.${identifier}`
    )
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as StaffRow | null) ?? null;
}

export async function listStaff(): Promise<StaffRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("staff")
    .select("id,name,staff_id,username,email,phone,role,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function updateStaffPassword(id: string, passwordHash: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("staff")
    .update({ password_hash: passwordHash })
    .eq("id", id);

  if (error) throw error;
}
