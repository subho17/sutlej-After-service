function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

const JWT_DEFAULT = "change-me-in-production";

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET ?? JWT_DEFAULT,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  // Supabase (Postgres) — the live database.
  SUPABASE_URL: optional("SUPABASE_URL"),
  SUPABASE_ANON_KEY: optional("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: optional("SUPABASE_SERVICE_ROLE_KEY"),
  // Outgoing mail: Brevo HTTP API preferred (works on hosts that block
  // SMTP ports, e.g. Render free tier). Falls back to SMTP for local dev.
  BREVO_API_KEY: optional("BREVO_API_KEY"),
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: optional("SMTP_USER"),
  SMTP_PASS: optional("SMTP_PASS"),
  SMTP_FROM: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@sutlej.com",
  OTP_TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES ?? 10),
  // Fixed inbox that receives staff password-reset OTPs (staff never get
  // OTPs on their own email).
  STAFF_RESET_EMAIL:
    process.env.STAFF_RESET_EMAIL ?? "inderjeet.s@sutlejautomotives.com",
} as const;

export function assertEnv(): void {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[backend] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. " +
        "Copy backend/.env.example to backend/.env and fill them in."
    );
  }
  if (env.NODE_ENV === "production" && env.JWT_SECRET === JWT_DEFAULT) {
    throw new Error("[backend] JWT_SECRET must be set in production.");
  }
}
