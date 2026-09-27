# Sutlej After-Service Backend

Express + TypeScript + Supabase (Postgres) API for the after-service portal.
Auth is JWT in an httpOnly cookie (`sutlej_token`); passwords and OTPs are
bcrypt-hashed. There is no Mongo/Mongoose path anymore.

## Folder structure

```
backend/
  src/
    server.ts        # entry: asserts env, starts HTTP server
    app.ts           # express app: CORS+cookies, routes, error handler
    config/
      env.ts         # typed env vars + assertEnv() fail-fast checks
      supabase.ts    # service-role client (backend-only)
    db/              # typed Supabase data-access (staff, customers,
                     # complaints, passwordResets, row types)
    routes/
      index.ts       # mounts /api/* routers + /api/health
      auth.routes.ts # login/logout/me + customer+staff OTP recovery
      staff.routes.ts     # staff-only (requireAuth + requireRole)
      customer.routes.ts  # authenticated users
      complaint.routes.ts # authenticated users
    controllers/     # req/res logic (no SQL here)
    middleware/
      asyncHandler.ts
      errorHandler.ts
      auth.ts        # requireAuth (cookie/Bearer) + requireRole()
    utils/
      ApiError.ts
      password.ts    # bcrypt hash/compare
      tokens.ts      # JWT sign/verify
      mailer.ts      # Gmail SMTP OTP emails
    types/
      index.ts
supabase/
  schema.sql       # tables + triggers + bcrypt-hashed demo seed
```

## Start

```bash
cd backend
copy .env.example .env   # then fill SUPABASE_*, SMTP_*, JWT_SECRET
npm install
npm run dev              # http://localhost:5000/api/health
```

First run `supabase/schema.sql` in Supabase SQL Editor (creates tables +
demo logins: STAFF001 / Staff@123, CUST001 / Customer@123).

## Conventions

- Routes define paths (+ guards) → controllers hold logic → `db/` holds queries.
- New feature (e.g. spares): add table in `supabase/schema.sql`,
  `db/spares.ts`, `spare.controller.ts`, `spare.routes.ts`,
  then mount in `routes/index.ts` as `/api/spares`.
- Staff-only routes get `requireAuth, requireRole("staff")`.
- Never return `password_hash` / `otp_hash` in responses (list queries
  already exclude them).
