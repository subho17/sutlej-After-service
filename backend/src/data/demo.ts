// Demo staff credentials — single source of truth for the backend.
// Frontend mirror lives in src/lib/demoStaff.ts (keep in sync).
// NOTE: demo only. Hash passwords (bcrypt) before production use.

export const DEMO_STAFF = {
  name: "Demo Staff",
  staffId: "STAFF001",
  username: "demo.staff",
  email: "staff@sutlej.com",
  phone: "9876543210",
  // Demo password (plain text for demo; stored as-is in passwordHash field)
  password: "Staff@123",
} as const;
