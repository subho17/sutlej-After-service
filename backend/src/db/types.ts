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
  ticket_no: string | null;
  title: string;
  description: string;
  customer_id: string | null;
  vehicle_id: string | null;
  assigned_staff_id: string | null;
  category: string | null;
  priority: string;
  status: "pending" | "open" | "in-progress" | "resolved" | "closed";
  history: unknown;
  created_by: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_reg_no: string | null;
  vehicle_model: string | null;
  source: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpareOrderRow {
  id: string;
  order_no: string | null;
  customer_id: string | null;
  items: Array<{
    partId?: string;
    partName?: string;
    partNumber?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
  total: number | string;
  status: "pending" | "processing" | "dispatched" | "delivered" | "cancelled";
  created_by: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_reg_no: string | null;
  vehicle_model: string | null;
  delivery_address: string | null;
  notes: string | null;
  owner_id: string | null;
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
