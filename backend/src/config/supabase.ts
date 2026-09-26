import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let adminClient: SupabaseClient | null = null;

/**
 * Supabase admin client (service-role key, bypasses RLS).
 * Use ONLY on the backend — never expose the service key to the frontend.
 * Returns null when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set,
 * so the app keeps running on Mongo until Supabase is configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
