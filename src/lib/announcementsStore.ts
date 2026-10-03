// Announcements (offers/greetings) — backed by the Supabase API.
// No localStorage: staff posts and customer views always read the same
// server copy so the portal works across devices.

import { apiDelete, apiGet, apiPost } from "./api";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  active: boolean;
}

interface AnnouncementPayload {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  active: boolean;
}

function toAnnouncement(p: AnnouncementPayload): Announcement {
  return {
    id: String(p.id),
    title: p.title ?? "",
    message: p.message ?? "",
    createdAt: p.createdAt ?? new Date().toISOString(),
    active: p.active !== false,
  };
}

/** Fetch announcements. `activeOnly` (default) returns only live ones for the portal. */
export async function fetchAnnouncements(activeOnly = true): Promise<Announcement[]> {
  const path = activeOnly ? "/api/announcements" : "/api/announcements?active=all";
  const { ok, body } = await apiGet<AnnouncementPayload[]>(path);
  if (!ok || !body?.data) return [];
  return body.data.map(toAnnouncement);
}

export async function postAnnouncement(title: string, message: string): Promise<Announcement | null> {
  const { ok, body } = await apiPost<AnnouncementPayload>("/api/announcements", { title, message });
  return ok && body?.data ? toAnnouncement(body.data) : null;
}

export async function removeAnnouncement(id: string): Promise<boolean> {
  try {
    await apiDelete(`/api/announcements/${encodeURIComponent(id)}`);
    return true;
  } catch {
    return false;
  }
}
