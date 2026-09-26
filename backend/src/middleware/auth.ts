import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

// Placeholder JWT guard — wire real verification when auth is implemented.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }
  next();
}
