import pg from "pg";
const pool = new pg.Pool({ host:'localhost', port:5432, database:'veda_setu', user:'postgres', password:'VedaSetu2026' });
const r = await pool.query(`SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.institutions'::regclass AND contype='c'`);
console.log(JSON.stringify(r.rows, null, 2));
pool.end();
