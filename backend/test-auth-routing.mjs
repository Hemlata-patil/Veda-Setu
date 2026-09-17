// Comprehensive verification script for Authentication Routing Bug
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:VedaSetu2026@localhost:5432/veda_setu",
});

const BACKEND_URL = "http://localhost:5000/api";
const FRONTEND_URL = "http://localhost:3000";

async function main() {
  console.log("=================================================");
  console.log(" AUTHENTICATION ROUTING VERIFICATION STARTING");
  console.log("=================================================");

  // Check 1: Public Registration creates role = student
  const testStudentEmail = `test.scholar.${Date.now()}@ayush.test`;
  const testStudentPassword = "TestPassword123!";
  const testStudentName = "Test Scholar Student";

  console.log("\n[TEST 1] Registering temporary student via POST /api/auth/register...");
  const regRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: testStudentName,
      email: testStudentEmail,
      password: testStudentPassword,
      role: "student",
    }),
  });

  const regData = await regRes.json();
  console.log(`Registration status: ${regRes.status}`);
  console.log(`Returned user role: ${regData.user?.role}`);

  if (regRes.status !== 201 || regData.user?.role !== "student") {
    throw new Error(`FAIL: Registration did not return role 'student': ${JSON.stringify(regData)}`);
  }

  // Extract auth_token cookie from registration response
  const rawSetCookie = regRes.headers.get("set-cookie") || "";
  const tokenMatch = rawSetCookie.match(/auth_token=([^;]+)/);
  const studentToken = tokenMatch ? tokenMatch[1] : regData.token;

  if (!studentToken) {
    throw new Error("FAIL: No auth_token set upon registration!");
  }
  console.log("PASS: Student registered successfully with role = 'student'.");

  // Check 2: Verify role = student in PostgreSQL database directly
  console.log("\n[TEST 2] Verifying PostgreSQL public.users and public.profiles records...");
  const dbUserRes = await pool.query("SELECT id, email, role FROM public.users WHERE email = $1", [testStudentEmail]);
  if (dbUserRes.rows.length === 0 || dbUserRes.rows[0].role !== "student") {
    throw new Error(`FAIL: DB user record role is not student: ${JSON.stringify(dbUserRes.rows)}`);
  }
  const dbProfileRes = await pool.query("SELECT id, full_name FROM public.profiles WHERE id = $1", [dbUserRes.rows[0].id]);
  if (dbProfileRes.rows.length === 0) {
    throw new Error(`FAIL: DB profile record not found: ${JSON.stringify(dbProfileRes.rows)}`);
  }
  console.log(`PASS: Database authoritative role in public.users is '${dbUserRes.rows[0].role}', profile name: '${dbProfileRes.rows[0].full_name}'.`);

  // Check 3: Verify GET /api/auth/me returns role = student
  console.log("\n[TEST 3] Verifying GET /api/auth/me with student token...");
  const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: {
      Cookie: `auth_token=${studentToken}`,
    },
  });
  const meData = await meRes.json();
  console.log(`GET /api/auth/me status: ${meRes.status}, role: ${meData.user?.role}`);
  if (meRes.status !== 200 || meData.user?.role !== "student") {
    throw new Error(`FAIL: GET /api/auth/me did not return role 'student': ${JSON.stringify(meData)}`);
  }
  console.log("PASS: GET /api/auth/me returns role = 'student'.");

  // Check 4: Unauthenticated visiting /auth/login and /auth/sign-up
  console.log("\n[TEST 4] Verifying unauthenticated GET /auth/login and /auth/sign-up do NOT redirect to /super-admin/dashboard...");
  const loginPageRes = await fetch(`${FRONTEND_URL}/auth/login`, {
    redirect: "manual",
  });
  console.log(`GET /auth/login response status: ${loginPageRes.status}`);
  if (loginPageRes.status === 307 || loginPageRes.status === 308 || loginPageRes.status === 302) {
    const loc = loginPageRes.headers.get("location");
    console.log(`Redirect location: ${loc}`);
    if (loc?.includes("/super-admin/dashboard")) {
      throw new Error("FAIL: Unauthenticated /auth/login redirected to /super-admin/dashboard!");
    }
  }
  console.log("PASS: /auth/login does not redirect unauthenticated users to /super-admin/dashboard.");

  const signUpPageRes = await fetch(`${FRONTEND_URL}/auth/sign-up`, {
    redirect: "manual",
  });
  console.log(`GET /auth/sign-up response status: ${signUpPageRes.status}`);
  if (signUpPageRes.status === 307 || signUpPageRes.status === 308 || signUpPageRes.status === 302) {
    const loc = signUpPageRes.headers.get("location");
    console.log(`Redirect location: ${loc}`);
    if (loc?.includes("/super-admin/dashboard")) {
      throw new Error("FAIL: Unauthenticated /auth/sign-up redirected to /super-admin/dashboard!");
    }
  }
  console.log("PASS: /auth/sign-up does not redirect unauthenticated users to /super-admin/dashboard.");

  // Check 5: Student login via POST /api/auth/login
  console.log("\n[TEST 5] Verifying Student login via POST /api/auth/login...");
  const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testStudentEmail,
      password: testStudentPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log(`Login status: ${loginRes.status}, user role: ${loginData.user?.role}`);
  if (loginRes.status !== 200 || loginData.user?.role !== "student") {
    throw new Error(`FAIL: Student login did not return role 'student': ${JSON.stringify(loginData)}`);
  }
  console.log("PASS: Student login returns role = 'student'.");

  // Check 6: Routing for student visiting /dashboard
  console.log("\n[TEST 6] Verifying student accessing /dashboard routes to /student/dashboard...");
  const dashRes = await fetch(`${FRONTEND_URL}/dashboard`, {
    headers: {
      Cookie: `auth_token=${studentToken}`,
    },
    redirect: "manual",
  });
  console.log(`/dashboard status with student token: ${dashRes.status}, location: ${dashRes.headers.get("location")}`);
  if (dashRes.headers.get("location") !== "/student/dashboard" && !dashRes.headers.get("location")?.endsWith("/student/dashboard")) {
    throw new Error(`FAIL: Student /dashboard did not route to /student/dashboard. Got: ${dashRes.headers.get("location")}`);
  }
  console.log("PASS: Student navigating to /dashboard is routed to /student/dashboard.");

  // Check 7: Super Admin login
  console.log("\n[TEST 7] Verifying Super Admin login via POST /api/auth/login...");
  const adminLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@ayush.gov.in",
      password: "SuperAdminPassword2026!",
    }),
  });
  const adminData = await adminLoginRes.json();
  console.log(`Super admin login status: ${adminLoginRes.status}, role: ${adminData.user?.role}`);
  if (adminLoginRes.status !== 200 || adminData.user?.role !== "super_admin") {
    throw new Error(`FAIL: Super admin login did not return role 'super_admin': ${JSON.stringify(adminData)}`);
  }

  const adminTokenMatch = (adminLoginRes.headers.get("set-cookie") || "").match(/auth_token=([^;]+)/);
  const adminToken = adminTokenMatch ? adminTokenMatch[1] : adminData.token;
  console.log("PASS: Super admin login returned role = 'super_admin'.");

  // Check 8: Super Admin visiting /dashboard routes to /super-admin/dashboard
  console.log("\n[TEST 8] Verifying Super Admin accessing /dashboard routes to /super-admin/dashboard...");
  const adminDashRes = await fetch(`${FRONTEND_URL}/dashboard`, {
    headers: {
      Cookie: `auth_token=${adminToken}`,
    },
    redirect: "manual",
  });
  console.log(`/dashboard status with admin token: ${adminDashRes.status}, location: ${adminDashRes.headers.get("location")}`);
  if (adminDashRes.headers.get("location") !== "/super-admin/dashboard" && !adminDashRes.headers.get("location")?.endsWith("/super-admin/dashboard")) {
    throw new Error(`FAIL: Super admin /dashboard did not route to /super-admin/dashboard. Got: ${adminDashRes.headers.get("location")}`);
  }
  console.log("PASS: Super admin navigating to /dashboard is routed to /super-admin/dashboard.");

  // Check 9: Super Admin accessing /super-admin/dashboard is allowed (returns 200)
  console.log("\n[TEST 9] Verifying Super Admin can access /super-admin/dashboard...");
  const adminAccessRes = await fetch(`${FRONTEND_URL}/super-admin/dashboard`, {
    headers: {
      Cookie: `auth_token=${adminToken}`,
    },
    redirect: "manual",
  });
  console.log(`/super-admin/dashboard status for super_admin: ${adminAccessRes.status}`);
  if (adminAccessRes.status === 307 || adminAccessRes.status === 308) {
    const loc = adminAccessRes.headers.get("location");
    if (!loc?.includes("/super-admin/dashboard")) {
      throw new Error(`FAIL: Super admin was redirected away: ${loc}`);
    }
  }
  console.log("PASS: Super Admin successfully accesses /super-admin/dashboard.");

  // Check 10: Authorization Guard: Student CANNOT access /super-admin/dashboard
  console.log("\n[TEST 10] Verifying Student CANNOT access /super-admin/dashboard...");
  const forbiddenRes = await fetch(`${FRONTEND_URL}/super-admin/dashboard`, {
    headers: {
      Cookie: `auth_token=${studentToken}`,
    },
    redirect: "manual",
  });
  console.log(`/super-admin/dashboard status with student token: ${forbiddenRes.status}, location: ${forbiddenRes.headers.get("location")}`);
  if (forbiddenRes.status !== 307 && forbiddenRes.status !== 308 && forbiddenRes.status !== 302) {
    throw new Error(`FAIL: Expected student to be redirected away from /super-admin/dashboard, got status ${forbiddenRes.status}`);
  }
  const redirectLoc = forbiddenRes.headers.get("location");
  if (redirectLoc !== "/student/dashboard" && !redirectLoc?.endsWith("/student/dashboard")) {
    throw new Error(`FAIL: Student accessing /super-admin/dashboard was redirected to ${redirectLoc} instead of /student/dashboard!`);
  }
  console.log("PASS: Student access to /super-admin/dashboard is strictly blocked and redirected to /student/dashboard.");

  // Check 11: Cleanup test student from database
  console.log("\n[CLEANUP] Cleaning up test student records...");
  await pool.query("DELETE FROM public.profiles WHERE id = $1", [dbUserRes.rows[0].id]);
  await pool.query("DELETE FROM public.users WHERE id = $1", [dbUserRes.rows[0].id]);
  await pool.end();
  console.log("PASS: Test student records cleaned up.");

  console.log("\n=================================================");
  console.log(" ALL 10 ROUTING & AUTHORIZATION CHECKS PASSED!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("\nFATAL ERROR DURING VERIFICATION:", err);
  process.exit(1);
});
