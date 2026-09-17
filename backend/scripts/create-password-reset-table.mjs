import pg from "pg";

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "veda_setu",
  user: "postgres",
  password: "VedaSetu2026",
});

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON public.password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
  `);
  console.log("password_reset_tokens table created successfully!");
  await pool.end();
}

run().catch(console.error);
