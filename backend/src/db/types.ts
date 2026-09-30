// Row types mirroring supabase/schema.sql. All queries go through the
// service-role client in ../config/supabase.js (RLS bypassed, backend-only).

export interface StaffRow {
  id: string;
  name: string;
  staff_id: string;
  username: string;
  email: string;
  phone: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  customer_id: string | null;
  phone: string;
  email: string | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintRow {
  id: string;
  title: string;
  description: string;
  status: "pending" | "open" | "in-progress" | "resolved";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PasswordResetRow {
  id: string;
  role: "customer" | "staff";
  customer_id: string | null;
  staff_id: string | null;
  email: string;
  otp_hash: string;
  expires_at: string;
  used: boolean;
  attempts: number;
  created_at: string;
}
