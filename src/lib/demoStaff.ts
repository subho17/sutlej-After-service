// Demo staff credentials — mirror of backend/src/data/demo.ts (keep in sync).
// Demo only: replace with real auth before production.

export const DEMO_STAFF = {
  name: "Demo Staff",
  staffId: "STAFF001",
  username: "demo.staff",
  email: "staff@sutlej.com",
  phone: "9876543210",
  password: "Staff@123",
} as const;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
