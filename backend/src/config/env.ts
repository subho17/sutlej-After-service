function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`[backend] missing env var: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  MONGO_URI: required("MONGO_URI", "mongodb://127.0.0.1:27017/after-service-sutlej"),
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET ?? "change-me-in-production",
  // Supabase (Postgres) — optional until configured; backend falls back to Mongo.
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // Outgoing mail (Gmail SMTP) for customer OTP emails
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@sutlej.com",
  OTP_TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES ?? 10),
} as const;
