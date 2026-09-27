import { supabaseAdmin } from "../config/supabase.js";
import type { PasswordResetRow } from "./types.js";

export async function invalidateResets(
  role: "customer" | "staff",
  accountId: string
): Promise<void> {
  const column = role === "customer" ? "customer_id" : "staff_id";
  const { error } = await supabaseAdmin()
    .from("password_resets")
    .update({ used: true })
    .eq("role", role)
    .eq(column, accountId)
    .eq("used", false);

  if (error) throw error;
}

export async function createReset(input: {
  role: "customer" | "staff";
  accountId: string;
  email: string;
  otpHash: string;
  expiresAt: Date;
}): Promise<void> {
  const column = input.role === "customer" ? "customer_id" : "staff_id";
  const { error } = await supabaseAdmin().from("password_resets").insert({
    role: input.role,
    [column]: input.accountId,
    email: input.email,
    otp_hash: input.otpHash,
    expires_at: input.expiresAt.toISOString(),
  });

  if (error) throw error;
}

export async function latestActiveReset(
  role: "customer" | "staff",
  accountId: string
): Promise<PasswordResetRow | null> {
  const column = role === "customer" ? "customer_id" : "staff_id";
  const { data, error } = await supabaseAdmin()
    .from("password_resets")
    .select("*")
    .eq("role", role)
    .eq(column, accountId)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as PasswordResetRow | null) ?? null;
}

export async function markResetUsed(id: string, attempts: number): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("password_resets")
    .update({ used: true, attempts })
    .eq("id", id);

  if (error) throw error;
}

export async function bumpResetAttempts(id: string, attempts: number): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("password_resets")
    .update({ attempts })
    .eq("id", id);

  if (error) throw error;
}
