// Single source of truth for announcements/offers (staff + customer).
//
// Background: staff published to `staffAnnouncements` while the customer
// dashboard never read any key at all — so published announcements never
// appeared in the portal. Everything now goes through load/save below.

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  active: boolean;
}

const SHARED_KEY = "sutlej_announcements";

// Legacy keys from before the unification (kept as mirrors for safety).
const LEGACY_KEYS = ["staffAnnouncements", "customerAnnouncements"] as const;

type RawAnnouncement = Partial<Announcement> & { id: string };

function asArray(value: unknown): RawAnnouncement[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (o): o is RawAnnouncement => typeof o === "object" && o !== null && "id" in o
  );
}

function readKey(key: string): RawAnnouncement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? asArray(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function normalizeAnnouncement(raw: RawAnnouncement): Announcement {
  return {
    id: String(raw.id),
    title: typeof raw.title === "string" ? raw.title : "",
    message: typeof raw.message === "string" ? raw.message : "",
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
    active: raw.active !== false,
  };
}

/**
 * Load all announcements. First call migrates legacy keys into the shared
 * key (deduplicated by id).
 */
export function loadAnnouncements(): Announcement[] {
  const shared = readKey(SHARED_KEY);
  if (shared.length > 0) return shared.map(normalizeAnnouncement);

  const merged = new Map<string, RawAnnouncement>();
  for (const key of LEGACY_KEYS) {
    for (const item of readKey(key)) merged.set(item.id, item);
  }
  const items = [...merged.values()].map(normalizeAnnouncement);
  if (items.length > 0) persist(items);
  return items;
}

function persist(items: Announcement[]): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(items);
    localStorage.setItem(SHARED_KEY, json);
    // Mirror to legacy keys for any old code paths still reading them.
    for (const key of LEGACY_KEYS) localStorage.setItem(key, json);
  } catch {
    // Ignore storage errors (private mode, quota).
  }
}

/** Save announcements — visible to BOTH staff and customer immediately. */
export function saveAnnouncements(items: Announcement[]): void {
  persist(items.map(normalizeAnnouncement));
}
