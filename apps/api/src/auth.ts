import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { DEFAULT_ELO, PADEL_CATEGORIES, type PadelCategory, type UserRole } from "@efecto/shared";
import { config } from "./config.js";
import { HttpError } from "./http.js";
import { queryOne } from "./db.js";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: "30d"
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function verifyGoogleIdToken(idToken: string) {
  if (!config.googleClientId) throw new HttpError(500, "GOOGLE_CLIENT_ID is not configured");
  const client = new OAuth2Client(config.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.googleClientId
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) throw new HttpError(401, "Invalid Google token");
  return payload;
}

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new HttpError(401, "Missing bearer token");

    const payload = verifyToken(token);
    const profile = await queryOne<AuthUser>(
      "select id, email, role from profiles where id = $1",
      [payload.sub]
    );
    if (!profile) throw new HttpError(401, "User not found");

    req.user = profile;
    return next();
  } catch (error) {
    return next(error instanceof HttpError ? error : new HttpError(401, "Invalid token"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || !["admin", "owner"].includes(req.user.role)) {
    return next(new HttpError(403, "Admin role required"));
  }
  return next();
}

export function normalizeCategory(value: string): PadelCategory {
  return (PADEL_CATEGORIES as readonly string[]).includes(value) ? (value as PadelCategory) : "5ta";
}

export const defaultUserValues = {
  role: "player" as UserRole,
  elo: DEFAULT_ELO
};
