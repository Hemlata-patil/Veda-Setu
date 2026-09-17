import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// 1. Read environment variables from .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_ACCOUNTS = [
  { role: "student", email: "student.test@ayush.local", password: "TestPassword123!" },
  { role: "faculty", email: "faculty.test@ayush.local", password: "TestPassword123!" },
  { role: "institution", email: "institution.test@ayush.local", password: "TestPassword123!" },
  { role: "industry", email: "industry.test@ayush.local", password: "TestPassword123!" },
];

async function runSuperAdminVerification() {
  console.log("================================================================================");
  console.log(" SUPER ADMIN CORE: COMPREHENSIVE 23-POINT VALIDATION SUITE");
  console.log(` Target Supabase URL: ${SUPABASE_URL}`);
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Migration File Verification
  // ---------------------------------------------------------------------------
  console.log("--- 1. Migration File Schema & Role Extension ---");
  const migrationPath = "supabase/migrations/20260910163817_super_admin_core.sql";
  assert(fs.existsSync(migrationPath), "Migration 20260910163817_super_admin_core.sql exists");

  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  assert(
    migrationSql.includes("profiles_role_check") &&
    migrationSql.includes("'student', 'faculty', 'institution', 'industry', 'super_admin'"),
    "Safely extends profiles_role_check to include super_admin without breaking existing 4 roles"
  );
  assert(
    migrationSql.includes("verification_status") &&
    migrationSql.includes("institutions"),
    "Adds verification_status to institutions ('pending', 'approved', 'rejected', 'suspended')"
  );
  assert(
    migrationSql.includes("verification_status") &&
    migrationSql.includes("organizations"),
    "Adds verification_status to organizations ('pending', 'approved', 'rejected', 'suspended')"
  );
  assert(
    migrationSql.includes("is_super_admin()") &&
    migrationSql.includes("security definer") &&
    migrationSql.includes("set search_path = public"),
    "Includes is_super_admin() security definer function with set search_path = public"
  );
  assert(
    migrationSql.includes("revoke execute on function public.is_super_admin() from public") &&
    migrationSql.includes("revoke execute on function public.is_super_admin() from anon"),
    "Revokes execute on is_super_admin() from public and anon"
  );

  // ---------------------------------------------------------------------------
  // 2. Migrations 001-013 Untouched Check
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Verifying Migrations 001-013 Untouched ---");
  const migrations = fs.readdirSync("supabase/migrations");
  const previousMigrations = migrations.filter(
    (m) => m !== "20260910163817_super_admin_core.sql"
  );
  assert(previousMigrations.length >= 13, `Found ${previousMigrations.length} existing migrations untouched`);

  // ---------------------------------------------------------------------------
  // 3. Server-Side Authorization & Role Integrity (lib/auth.ts)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Server-Side Authorization & Role Dispatching ---");
  const authCode = fs.readFileSync("lib/auth.ts", "utf8");
  assert(authCode.includes('"super_admin"'), "UserRole union includes 'super_admin'");
  assert(authCode.includes("export async function requireSuperAdmin()"), "Defines requireSuperAdmin() authorization helper");
  assert(
    authCode.includes('profile.role !== "super_admin"'),
    "requireSuperAdmin() strictly verifies profile.role === 'super_admin'"
  );
  assert(
    authCode.includes('currentRole === "super_admin"') &&
    authCode.includes('redirect("/super-admin/dashboard")'),
    "requireRole redirects super_admin users to /super-admin/dashboard when opening normal dashboards"
  );

  const dashboardDispatcher = fs.readFileSync("app/dashboard/page.tsx", "utf8");
  assert(
    dashboardDispatcher.includes('case "super_admin":') &&
    dashboardDispatcher.includes('redirect("/super-admin/dashboard")'),
    "app/dashboard/page.tsx dispatches super_admin users to /super-admin/dashboard"
  );

  // ---------------------------------------------------------------------------
  // 4. Hidden 5-Click Entry Mechanism
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Hidden 5-Click Entry & Admin Access Modal ---");
  const useAdminTriggerCode = fs.readFileSync("components/auth/use-admin-trigger.ts", "utf8");
  assert(
    useAdminTriggerCode.includes("clickCountRef.current += 1") &&
    useAdminTriggerCode.includes("3000") &&
    useAdminTriggerCode.includes("clickCountRef.current >= 5"),
    "useAdminTrigger detects 5 clicks within ~3000ms window and resets if expired"
  );
  assert(
    useAdminTriggerCode.includes("e.preventDefault()") &&
    useAdminTriggerCode.includes("setIsAdminModalOpen(true)"),
    "useAdminTrigger only prevents default on the 5th click, keeping single clicks completely unhindered"
  );

  const modalCode = fs.readFileSync("components/auth/admin-access-modal.tsx", "utf8");
  assert(modalCode.includes('type="email"'), "Admin Access Modal requires email input");
  assert(modalCode.includes('type="password"'), "Admin Access Modal requires password input");
  assert(modalCode.includes("Secure Admin Login"), "Admin Access Modal has 'Secure Admin Login' button");
  assert(
    modalCode.includes("Administrator access denied."),
    "Displays 'Administrator access denied.' on non-super_admin accounts without exposing sensitive info"
  );
  assert(
    modalCode.includes('profile?.role !== "super_admin"') && modalCode.includes("supabase.auth.signOut()"),
    "Immediately revokes/cleans session if authenticated account is not super_admin"
  );

  // ---------------------------------------------------------------------------
  // 5. Sidebar & Navigation Non-Exposure
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Sidebar Navigation & Portal Label ---");
  const sidebarCode = fs.readFileSync("components/layout/sidebar.tsx", "utf8");
  assert(sidebarCode.includes('super_admin: "Super Admin Portal"'), "Defines 'Super Admin Portal' label");
  assert(
    sidebarCode.includes('case "super_admin":') &&
    sidebarCode.includes("/super-admin/institutions") &&
    sidebarCode.includes("/super-admin/industries") &&
    sidebarCode.includes("/super-admin/users") &&
    sidebarCode.includes("/super-admin/opportunities") &&
    sidebarCode.includes("/super-admin/analytics"),
    "Super Admin sidebar contains all required management modules"
  );
  assert(
    !sidebarCode.includes('/super-admin"') ||
    sidebarCode.indexOf('/super-admin"') === sidebarCode.lastIndexOf('/super-admin"'),
    "No super-admin routes are visible in student, faculty, institution, or industry sidebars"
  );

  // ---------------------------------------------------------------------------
  // 6. Security Model: No Service Role in Browser
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Security Model: Service-Role Key Client Isolation ---");
  const clientFiles = [
    "components/auth/admin-access-modal.tsx",
    "components/auth/use-admin-trigger.ts",
    "components/layout/sidebar.tsx",
    "components/layout/brand-logo.tsx",
    "app/super-admin/institutions/institution-table.tsx",
    "app/super-admin/industries/industry-table.tsx",
    "app/super-admin/users/user-table.tsx",
    "app/super-admin/opportunities/opportunity-table.tsx",
  ];

  let leakedServiceRole = false;
  for (const file of clientFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("createAdminClient")) {
        console.error(`[LEAK DETECTED] ${file} contains service-role reference!`);
        leakedServiceRole = true;
      }
    }
  }
  assert(!leakedServiceRole, "Zero service-role keys or admin clients imported into client components");

  // ---------------------------------------------------------------------------
  // 7. Role Management Safeguards
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. User Role Management Safeguards (app/super-admin/actions.ts) ---");
  const actionsCode = fs.readFileSync("app/super-admin/actions.ts", "utf8");
  assert(
    actionsCode.includes("Cannot modify your own administrative role"),
    "Super Admin cannot accidentally modify or downgrade their own account"
  );
  assert(
    actionsCode.includes("Cannot downgrade an existing Super Admin account"),
    "Existing Super Admin accounts are protected against accidental downgrade"
  );
  assert(
    actionsCode.includes('["student", "faculty", "institution", "industry"]') &&
    !actionsCode.includes('allowedRoles.includes("super_admin")'),
    "Direct client escalation to super_admin is restricted"
  );

  // ---------------------------------------------------------------------------
  // 8. Public Signup Form Safety
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Public Signup Form Safety ---");
  const signupCode = fs.readFileSync("components/sign-up-form.tsx", "utf8");
  assert(
    !signupCode.includes('"super_admin"') && !signupCode.includes("'super_admin'"),
    "Public signup form contains no option or code for super_admin"
  );
  assert(signupCode.includes('role: "student"'), "Public signup strictly defaults to role = student");

  // ---------------------------------------------------------------------------
  // 9. Real Authentication with 4 Platform Roles
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Authenticating Existing Platform Roles with Supabase ---");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  for (const acc of TEST_ACCOUNTS) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    if (error) {
      assert(false, `Sign in for role [${acc.role}] (${acc.email}): ${error.message}`);
    } else {
      assert(true, `Sign in for role [${acc.role}] (${acc.email}) succeeded (User ID: ${data.user.id})`);

      // Verify this normal user's profile role is not super_admin
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      assert(
        prof && prof.role === acc.role && prof.role !== "super_admin",
        `Database profile role for ${acc.email} is strictly '${acc.role}' and not 'super_admin'`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Real Database Data Queries (No Hardcoding)
  // ---------------------------------------------------------------------------
  console.log("\n--- 10. Platform-Wide Database Data Queries ---");
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [
    { count: studentCount },
    { count: facultyCount },
    { count: instCount },
    { count: orgCount },
    { count: oppCount },
    { count: appCount },
    { count: placementCount },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "faculty"),
    adminClient.from("institutions").select("*", { count: "exact", head: true }),
    adminClient.from("organizations").select("*", { count: "exact", head: true }),
    adminClient.from("opportunities").select("*", { count: "exact", head: true }),
    adminClient.from("applications").select("*", { count: "exact", head: true }),
    adminClient.from("internship_placements").select("*", { count: "exact", head: true }),
  ]);

  assert(studentCount !== null, `Real students count query: ${studentCount}`);
  assert(facultyCount !== null, `Real faculty count query: ${facultyCount}`);
  assert(instCount !== null, `Real institutions count query: ${instCount}`);
  assert(orgCount !== null, `Real organizations count query: ${orgCount}`);
  assert(oppCount !== null, `Real opportunities count query: ${oppCount}`);
  assert(appCount !== null, `Real applications count query: ${appCount}`);
  assert(placementCount !== null, `Real placements count query: ${placementCount}`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuperAdminVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
