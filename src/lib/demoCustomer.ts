// Demo customer credentials — mirror of backend/src/data/demo.ts (keep in sync).
// Demo only: never render these in the UI. Replace with real auth before production.

export const DEMO_CUSTOMER = {
  name: "Demo Customer",
  customerId: "CUST001",
  email: "customer@sutlej.com",
  phone: "9876501234",
  password: "Customer@123",
} as const;
