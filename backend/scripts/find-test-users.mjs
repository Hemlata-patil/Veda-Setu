import pg from "pg";

const pool = new pg.Pool({
  host: "localhost", port: 5432, database: "veda_setu", user: "postgres", password: "VedaSetu2026"
});

const r = await pool.query(
  `SELECT u.id, u.email, u.role, p.full_name, p.institution_id, i.name AS institution_name
   FROM public.users u
   LEFT JOIN public.profiles p ON p.id = u.id
   LEFT JOIN public.institutions i ON i.id = p.institution_id
   WHERE u.role = 'institution'
   LIMIT 5`
);
console.log("INSTITUTION USERS:", JSON.stringify(r.rows, null, 2));

const s = await pool.query(`SELECT u.id, u.email, u.role FROM public.users u WHERE u.role = 'student' LIMIT 3`);
console.log("STUDENT USERS:", JSON.stringify(s.rows, null, 2));

pool.end();
