import { supabaseAdmin } from "../config/supabase.js";
import type { CustomerRow } from "./types.js";

export async function findCustomerByIdentifier(identifier: string): Promise<CustomerRow | null> {
  const idLower = identifier.toLowerCase();
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("*")
    .or(`customer_id.eq.${identifier},email.eq.${idLower},phone.eq.${identifier}`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CustomerRow | null) ?? null;
}

export async function listCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("id,name,customer_id,phone,email,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomerRow[];
}

export async function createCustomer(input: {
  name: string;
  phone: string;
  email?: string;
}): Promise<CustomerRow> {
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CustomerRow;
}

export async function updateCustomerPassword(id: string, passwordHash: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("customers")
    .update({ password_hash: passwordHash })
    .eq("id", id);

  if (error) throw error;
}
