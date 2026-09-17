import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";

const poolConfig: PoolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

/**
 * Execute a query with connection pooling
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === "development") {
    // Log query timings in development
    // console.debug("Executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Test connectivity to the database
 */
export async function testConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const res = await pool.query("SELECT 1 AS health");
    return { connected: res.rows?.[0]?.health === 1 };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

/**
 * Gracefully terminate the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export const db = {
  query,
  pool,
  testConnection,
  closePool,
};
