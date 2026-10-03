import { supabaseAdmin } from "../config/supabase.js";

export interface SparePartRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export async function listSpareParts(): Promise<SparePartRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("spare_parts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SparePartRow[];
}

export async function createSparePart(input: {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}): Promise<SparePartRow> {
  const { data, error } = await supabaseAdmin()
    .from("spare_parts")
    .insert({
      sku: input.sku,
      name: input.name,
      category: input.category,
      price: input.price,
      stock: input.stock,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SparePartRow;
}

export async function updateSparePart(
  sku: string,
  input: { name?: string; category?: string; price?: number; stock?: number }
): Promise<SparePartRow> {
  const { data, error } = await supabaseAdmin()
    .from("spare_parts")
    .update(input)
    .eq("sku", sku)
    .select()
    .single();
  if (error) throw error;
  return data as SparePartRow;
}

export async function deleteSparePart(sku: string): Promise<void> {
  const { error } = await supabaseAdmin().from("spare_parts").delete().eq("sku", sku);
  if (error) throw error;
}
