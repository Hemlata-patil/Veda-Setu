/**
 * seed-7c11-super-admin.mjs
 * ══════════════════════════════════════════════════════════════════════
 * Seeds a super_admin user for 7C-11 E2E testing.
 * Also ensures a non-super_admin target user exists for role update tests.
 * ══════════════════════════════════════════════════════════════════════
 * Run: node backend/scripts/seed-7c11-super-admin.mjs
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from backend/.env
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const [k, ...vParts] = line.split("=");
  if (k && vParts.length) process.env[k.trim()] = vParts.join("=").trim().replace(/^['"]|['"]$/g, "");
}

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SUPER_ADMIN_EMAIL = "superadmin_7c11@vedasetu.test";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@7c11!";
const SUPER_ADMIN_NAME = "Super Admin Test 7C11";

// Target student for role tests (reuse existing or create)
const TARGET_STUDENT_EMAIL = "role_target_7c11@vedasetu.test";
const TARGET_STUDENT_PASSWORD = "Student@7c11!";
const TARGET_STUDENT_NAME = "Role Target Student 7C11";

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Seeding super_admin user for 7C-11 E2E...\n");

    // ── 1. Super Admin ──────────────────────────────────────────────
    const existingSA = await client.query(
      "SELECT id, email FROM public.users WHERE email = $1",
      [SUPER_ADMIN_EMAIL]
    );

    let superAdminId;
    if (existingSA.rows.length > 0) {
      superAdminId = existingSA.rows[0].id;
      console.log(`✅ Super admin already exists: ${SUPER_ADMIN_EMAIL} (${superAdminId})`);
    } else {
      const hash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
      const res = await client.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'super_admin') RETURNING id`,
        [SUPER_ADMIN_EMAIL, hash]
      );
      superAdminId = res.rows[0].id;

      // Create profile
      await client.query(
        `INSERT INTO public.profiles (id, full_name) VALUES ($1, $2)`,
        [superAdminId, SUPER_ADMIN_NAME]
      );
      console.log(`✅ Super admin created: ${SUPER_ADMIN_EMAIL} (${superAdminId})`);
    }

    // ── 2. Target student for role update tests ──────────────────────
    const existingTarget = await client.query(
      "SELECT id, email FROM public.users WHERE email = $1",
      [TARGET_STUDENT_EMAIL]
    );

    let targetStudentId;
    if (existingTarget.rows.length > 0) {
      targetStudentId = existingTarget.rows[0].id;
      // Reset role to 'student' in case previous test left it changed
      await client.query(
        "UPDATE public.users SET role = 'student' WHERE id = $1",
        [targetStudentId]
      );
      console.log(`✅ Target student already exists (role reset to student): ${TARGET_STUDENT_EMAIL} (${targetStudentId})`);
    } else {
      const hash = await bcrypt.hash(TARGET_STUDENT_PASSWORD, 10);
      const res = await client.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'student') RETURNING id`,
        [TARGET_STUDENT_EMAIL, hash]
      );
      targetStudentId = res.rows[0].id;
      await client.query(
        `INSERT INTO public.profiles (id, full_name) VALUES ($1, $2)`,
        [targetStudentId, TARGET_STUDENT_NAME]
      );
      console.log(`✅ Target student created: ${TARGET_STUDENT_EMAIL} (${targetStudentId})`);
    }

    console.log("\n══════════════════════════════════════════");
    console.log("  SEED COMPLETE — Copy these for E2E:");
    console.log("══════════════════════════════════════════");
    console.log(`  SUPER_ADMIN_EMAIL    = ${SUPER_ADMIN_EMAIL}`);
    console.log(`  SUPER_ADMIN_PASSWORD = ${SUPER_ADMIN_PASSWORD}`);
    console.log(`  SUPER_ADMIN_ID       = ${superAdminId}`);
    console.log(`  TARGET_STUDENT_ID    = ${targetStudentId}`);
    console.log("══════════════════════════════════════════\n");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
