import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { corsMiddleware } from "./middleware/cors.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import apiRoutes from "./routes";
import { closePool } from "./db";

export const app: Application = express();

// Security & Parsing Middlewares
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging (development mode)
if (env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    // Basic structured request logging
    // console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Mount API routes
app.use("/api", apiRoutes);

// 404 Handler for unmatched routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

// Start server if run directly
let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(` VEDA SETU Backend Server running`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` Listening on: http://localhost:${env.PORT}`);
    console.log(` Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(async () => {
        console.log("HTTP server closed.");
        try {
          await closePool();
          console.log("PostgreSQL connection pool closed.");
        } catch (err) {
          console.error("Error closing PostgreSQL pool:", err);
        }
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
