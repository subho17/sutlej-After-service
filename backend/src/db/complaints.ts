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
