/**
 * seed-7c10-test-data.mjs
 * Creates an institution + institution admin user + some associated students for 7C-10 E2E testing.
 */
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  host: "localhost", port: 5432, database: "veda_setu", user: "postgres", password: "VedaSetu2026"
});

const INST_EMAIL = "inst_admin_7c10@vedasetu.test";
const INST_PASSWORD = "Test@1234";
const STUDENT_EMAIL = "student_7c10@vedasetu.test";
const STUDENT_PASSWORD = "Test@1234";

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create or get institution
    let instRow = await client.query(
      `SELECT id FROM public.institutions WHERE code = 'TEST7C10' LIMIT 1`
    );
    let institutionId;
    if (instRow.rows.length === 0) {
      const ins = await client.query(
        `INSERT INTO public.institutions (name, code, category, location, verification_status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ["Veda Setu Test College", "TEST7C10", "ayurveda", "Pune, Maharashtra", "approved"]
      );
      institutionId = ins.rows[0].id;
      console.log("✅ Created institution:", institutionId);
    } else {
      institutionId = instRow.rows[0].id;
      console.log("ℹ️  Using existing institution:", institutionId);
    }

    // 2. Create institution admin user
    const adminExists = await client.query(`SELECT id FROM public.users WHERE email = $1 LIMIT 1`, [INST_EMAIL]);
    let adminId;
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash(INST_PASSWORD, 10);
      const userRes = await client.query(
        `INSERT INTO public.users (email, password_hash, role) VALUES ($1, $2, 'institution') RETURNING id`,
        [INST_EMAIL, hash]
      );
      adminId = userRes.rows[0].id;
      await client.query(
        `INSERT INTO public.profiles (id, full_name, institution_id) VALUES ($1, $2, $3)`,
        [adminId, "Test Institution Admin 7C10", institutionId]
      );
      console.log("✅ Created institution admin:", adminId, INST_EMAIL);
    } else {
      adminId = adminExists.rows[0].id;
      // Ensure profile has institution_id
      await client.query(
        `UPDATE public.profiles SET institution_id = $1 WHERE id = $2`,
        [institutionId, adminId]
      );
      console.log("ℹ️  Using existing institution admin:", adminId, INST_EMAIL);
    }

    // 3. Create a student user linked to this institution
    const stuExists = await client.query(`SELECT id FROM public.users WHERE email = $1 LIMIT 1`, [STUDENT_EMAIL]);
    let studentId;
    if (stuExists.rows.length === 0) {
      const hash = await bcrypt.hash(STUDENT_PASSWORD, 10);
      const stuRes = await client.query(
        `INSERT INTO public.users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING id`,
        [STUDENT_EMAIL, hash]
      );
      studentId = stuRes.rows[0].id;
      await client.query(
        `INSERT INTO public.profiles (id, full_name, institution_id, program, year, department)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [studentId, "Test Student 7C10", institutionId, "BAMS", 2, "Kayachikitsa"]
      );
      console.log("✅ Created student:", studentId, STUDENT_EMAIL);
    } else {
      studentId = stuExists.rows[0].id;
      await client.query(
        `UPDATE public.profiles SET institution_id = $1 WHERE id = $2`,
        [institutionId, studentId]
      );
      console.log("ℹ️  Using existing student:", studentId, STUDENT_EMAIL);
    }

    // 4. Create a faculty user linked to this institution
    const FACULTY_EMAIL = "faculty_7c10@vedasetu.test";
    const facExists = await client.query(`SELECT id FROM public.users WHERE email = $1 LIMIT 1`, [FACULTY_EMAIL]);
    if (facExists.rows.length === 0) {
      const hash = await bcrypt.hash("Test@1234", 10);
      const facRes = await client.query(
        `INSERT INTO public.users (email, password_hash, role) VALUES ($1, $2, 'faculty') RETURNING id`,
        [FACULTY_EMAIL, hash]
      );
      const facId = facRes.rows[0].id;
      await client.query(
        `INSERT INTO public.profiles (id, full_name, institution_id, designation, department)
         VALUES ($1, $2, $3, $4, $5)`,
        [facId, "Dr. Test Faculty 7C10", institutionId, "Professor", "Ayurveda Samhita & Siddhanta"]
      );
      console.log("✅ Created faculty:", facId, FACULTY_EMAIL);
    } else {
      console.log("ℹ️  Faculty already exists:", FACULTY_EMAIL);
    }

    await client.query("COMMIT");

    console.log("\n📋 Test Credentials:");
    console.log(`  Institution Admin: ${INST_EMAIL} / ${INST_PASSWORD}`);
    console.log(`  Student:           ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
    console.log(`  Institution ID:    ${institutionId}\n`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
