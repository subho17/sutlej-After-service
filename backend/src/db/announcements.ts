import { supabaseAdmin } from "../config/supabase.js";

export interface AnnouncementRow {
  id: string;
  title: string;
  message: string;
  active: boolean;
  published_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function listAnnouncements(activeOnly: boolean): Promise<AnnouncementRow[]> {
  let query = supabaseAdmin()
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AnnouncementRow[];
}

export async function createAnnouncement(input: {
  title: string;
  message: string;
  publishedBy?: string;
}): Promise<AnnouncementRow> {
  const { data, error } = await supabaseAdmin()
    .from("announcements")
    .insert({
      title: input.title,
      message: input.message,
      published_by: input.publishedBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AnnouncementRow;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("announcements").delete().eq("id", id);
  if (error) throw error;
}
