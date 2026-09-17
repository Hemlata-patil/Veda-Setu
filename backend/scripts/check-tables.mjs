import pg from "pg";

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "veda_setu",
  user: "postgres",
  password: "VedaSetu2026",
});

// Check which backend API routes are registered for /institution/*
const res = await pool.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('internship_placements', 'placements', 'applications', 'student_competencies', 'opportunities')
  ORDER BY table_name
`);
console.log("Tables:", res.rows.map(r => r.table_name).join(", "));
pool.end();
