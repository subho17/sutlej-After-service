import { supabaseAdmin } from "../config/supabase.js";

export interface SignupRequestRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  otp_hash: string;
  expires_at: string;
  used: boolean;
  attempts: number;
  created_at: string;
}

export async function invalidateSignupRequests(email: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("signup_requests")
    .update({ used: true })
    .eq("email", email.toLowerCase())
    .eq("used", false);

  if (error) throw error;
}

export async function createSignupRequest(input: {
  name: string;
  phone: string;
  email: string;
  otpHash: string;
  expiresAt: Date;
}): Promise<void> {
  const { error } = await supabaseAdmin().from("signup_requests").insert({
    name: input.name,
    phone: input.phone,
    email: input.email.toLowerCase(),
    otp_hash: input.otpHash,
    expires_at: input.expiresAt.toISOString(),
  });

  if (error) throw error;
}

export async function latestActiveSignupRequest(
  email: string
): Promise<SignupRequestRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("signup_requests")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as SignupRequestRow | null) ?? null;
}

export async function markSignupUsed(id: string, attempts: number): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("signup_requests")
    .update({ used: true, attempts })
    .eq("id", id);

  if (error) throw error;
}

export async function bumpSignupAttempts(id: string, attempts: number): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("signup_requests")
    .update({ attempts })
    .eq("id", id);

  if (error) throw error;
}
