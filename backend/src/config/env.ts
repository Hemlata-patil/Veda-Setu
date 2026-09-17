import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env file if present
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.string().default("5432").transform((val) => parseInt(val, 10)),
  DB_USER: z.string().default("postgres"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("veda_setu"),
  DB_SSL: z
    .string()
    .default("false")
    .transform((val) => val.toLowerCase() === "true"),
  JWT_SECRET: z.string().default("veda_setu_dev_secret_key_minimum_32_chars_12345"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  throw new Error("Invalid environment configuration. Please check your .env file.");
}

export const env = parsed.data;
