import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyAuthToken, type AuthTokenPayload } from "../utils/tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.["sutlej_token"];
  if (typeof cookieToken === "string" && cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, "Not authenticated. Please log in.");

  try {
    req.user = verifyAuthToken(token);
  } catch {
    throw new ApiError(401, "Session expired. Please log in again.");
  }
  next();
}

export function requireRole(role: AuthTokenPayload["role"]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Not authenticated. Please log in.");
    if (req.user.role !== role) {
      throw new ApiError(403, "You do not have access to this resource.");
    }
    next();
  };
}
