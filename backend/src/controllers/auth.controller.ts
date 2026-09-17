import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema } from "../utils/validation";
import { env } from "../config/env";

const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Helper to set secure HttpOnly authentication cookie
 */
function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * POST /api/auth/register
 * Public registration restricted exclusively to students
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = registerSchema.parse(req.body);
    const result = await authService.registerStudent(validatedInput);

    setAuthCookie(res, result.token);

    res.status(201).json({
      status: "success",
      message: "Student account created successfully.",
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Standard credentials authentication
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedInput);

    setAuthCookie(res, result.token);

    res.status(200).json({
      status: "success",
      message: "Authentication successful.",
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clears authentication session cookie
 */
export function logout(req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully.",
  });
}

/**
 * GET /api/auth/me
 * Retrieves current authenticated user identity and profile
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Initiates password reset by issuing a secure time-limited single-use token
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(validatedInput);

    res.status(200).json({
      status: "success",
      message: result.message,
      ...(result.resetToken && env.NODE_ENV !== "production" ? { resetToken: result.resetToken } : {}),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Resets user password using a time-limited single-use reset token
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(validatedInput);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/update-password
 * Updates password for currently authenticated user
 */
export async function updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = updatePasswordSchema.parse(req.body);
    const result = await authService.updatePassword(req.user!.userId, validatedInput);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}
