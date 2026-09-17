import pg from "pg";

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "veda_setu",
  user: "postgres",
  password: "VedaSetu2026",
});

const res = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name='institutions' AND table_schema='public' ORDER BY ordinal_position"
);
console.log("Institutions columns:", res.rows.map((r) => r.column_name).join(", "));

const res2 = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name='mentorships' AND table_schema='public' ORDER BY ordinal_position"
);
console.log("Mentorships columns:", res2.rows.map((r) => r.column_name).join(", "));

pool.end();
