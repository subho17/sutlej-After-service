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
} as const;
