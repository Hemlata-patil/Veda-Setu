import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type UserRole = "student" | "faculty" | "institution" | "industry" | "super_admin";

export interface UserTokenPayload {
  userId: string;
  role: UserRole;
}

/**
 * Generates a signed JWT with minimal identity payload
 */
export function signToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

/**
 * Verifies a JWT and extracts the identity payload
 */
export function verifyToken(token: string): UserTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as UserTokenPayload;
}
