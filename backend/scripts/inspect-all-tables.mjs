import pg from "pg";

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  database: "veda_setu",
  user: "postgres",
  password: "VedaSetu2026",
});

async function run() {
  const res = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log("ALL TABLES IN VEDA_SETU:\n" + res.rows.map(r => ` - ${r.table_name}`).join("\n"));
  await pool.end();
}

run().catch(console.error);
