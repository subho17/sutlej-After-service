# Sutlej After-Service Backend

Express + TypeScript + Mongoose API for the after-service portal.

## Folder structure

```
backend/
  src/
    server.ts        # entry: connects DB, starts HTTP server
    app.ts           # express app: middleware, routes, error handler
    config/
      env.ts         # typed env vars (PORT, MONGO_URI, FRONTEND_URL)
      db.ts          # mongoose connect/disconnect
    routes/
      index.ts       # mounts /api/* routers + /api/health
      auth.routes.ts
      staff.routes.ts
      customer.routes.ts
      complaint.routes.ts
    controllers/     # req/res logic (no DB schema here)
    models/          # mongoose schemas (Staff, Customer, Complaint)
    middleware/
      asyncHandler.ts
      errorHandler.ts
      auth.ts        # placeholder JWT guard, wire up later
    utils/
      ApiError.ts
    types/
      index.ts
```

## Start

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run dev            # http://localhost:5000/api/health
```

## Conventions

- Routes only define paths → controllers hold logic → models hold schemas.
- New feature (e.g. spares): add `Spare.ts` in `models/`, `spare.controller.ts`,
  `spare.routes.ts`, then mount in `routes/index.ts` as `/api/spares`.
- Keep auth checks in `middleware/auth.ts`, validation before controllers.
