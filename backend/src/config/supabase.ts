import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let adminClient: SupabaseClient | null = null;

/**
 * Supabase admin client (service-role key, bypasses RLS).
 * Backend-only — the service key must never reach the frontend.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[backend] Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!adminClient) {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}
