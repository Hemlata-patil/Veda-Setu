import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Centralized Error-Handling Middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      status: "fail",
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Handle SyntaxError (e.g., malformed JSON payload)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      status: "fail",
      message: "Malformed JSON payload in request body",
    });
    return;
  }

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        status: "fail",
        message: "File size must be 5 MB or smaller.",
      });
      return;
    }
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
    return;
  }

  // Handle Custom Operational App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? "error" : "fail",
      message: err.message,
    });
    return;
  }

  // Log unexpected errors
  console.error("Unhandled Error:", err);

  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === "production" && statusCode >= 500
      ? "Internal Server Error"
      : err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    status: "error",
    message,
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
