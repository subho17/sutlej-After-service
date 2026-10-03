import { supabaseAdmin } from "../config/supabase.js";

export interface VehicleRow {
  id: string;
  customer_id: string;
  reg_no: string;
  model: string;
  last_service_at: string | null;
  next_service_at: string | null;
}

export async function createVehicle(input: {
  customerId: string;
  regNo: string;
  model: string;
  nextServiceAt: Date;
}): Promise<VehicleRow> {
  const { data, error } = await supabaseAdmin()
    .from("vehicles")
    .insert({
      customer_id: input.customerId,
      reg_no: input.regNo,
      model: input.model,
      next_service_at: input.nextServiceAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as VehicleRow;
}

export async function listVehicles(customerId?: string): Promise<VehicleRow[]> {
  let query = supabaseAdmin()
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as VehicleRow[];
}
