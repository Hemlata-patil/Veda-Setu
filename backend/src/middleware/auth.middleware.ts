import { Request, Response, NextFunction } from "express";
import { verifyToken, UserRole, UserTokenPayload } from "../utils/jwt";
import { AppError } from "./error.middleware";

// Extend Express Request interface to carry authenticated user information
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

/**
 * Authentication Middleware: "Who are you?"
 * Reads token from HttpOnly cookie or Authorization Bearer header,
 * verifies signature and expiration, and attaches user info to request.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  // 2. Check Authorization Bearer header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    res.status(401).json({
      status: "fail",
      message: "Authentication required. Please log in to access this resource.",
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      status: "fail",
      message:
        err.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid authentication token. Please log in again.",
    });
    return;
  }
}

/**
 * Authorization Middleware: "What are you allowed to do?"
 * Checks if the authenticated user has one of the allowed roles.
 * Returns 403 Forbidden if authenticated but unauthorized.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "fail",
        message: "Authentication required before role verification.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "fail",
        message: `Access denied. Your role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}
