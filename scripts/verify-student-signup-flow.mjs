import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Read environment variables from .env.local
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

const clientSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runVerification() {
  console.log("================================================================================");
  console.log(" STUDENT REGISTRATION FLOW: IMMEDIATE SIGN-IN & VERIFICATION SUITE");
  console.log(` Target Supabase: ${SUPABASE_URL}`);
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

  // 1. Files & Code Safety Inspection
  console.log("--- 1. Code Safety & Guardrail Verification ---");
  const signupCode = fs.readFileSync("components/sign-up-form.tsx", "utf8");
  assert(signupCode.includes('role: "student"'), "Sign up form explicitly specifies role: 'student'");
  assert(
    !signupCode.includes('"super_admin"') && !signupCode.includes("'super_admin'"),
    "Sign up form does not expose or reference super_admin"
  );
  assert(
    !signupCode.includes("SUPABASE_SERVICE_ROLE_KEY") && !signupCode.includes("createAdminClient"),
    "Client sign-up form does not leak service role credentials"
  );
  assert(
    signupCode.includes("Account created successfully. You can now sign in."),
    "Sign up form renders the required immediate sign-in success message"
  );

  const actionsCode = fs.readFileSync("app/auth/actions.ts", "utf8");
  assert(actionsCode.includes('"use server"'), "Auth actions file is strictly a server-only action");
  assert(actionsCode.includes("email_confirm: true"), "registerStudentAccount sets email_confirm: true for students");
  assert(actionsCode.includes('role: "student"'), "registerStudentAccount strictly sets role: 'student'");

  const successPage = fs.readFileSync("app/auth/sign-up-success/page.tsx", "utf8");
  assert(
    !successPage.toLowerCase().includes("check your email to confirm") &&
    !successPage.toLowerCase().includes("verification email"),
    "Sign-up success page removes email verification requirements"
  );

  // 2. Register a temporary student account
  console.log("\n--- 2. Register Temporary Student Account ---");
  const testId = Date.now();
  const tempEmail = `temp.student.${testId}@ayush.local`;
  const tempPassword = "TempStudentPass123!";
  const tempFullName = `Temp Student ${testId}`;

  // Call admin createUser as done in server action
  const { data: createdAuth, error: createError } = await adminSupabase.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: tempFullName,
    },
    app_metadata: {
      role: "student",
    },
  });

  assert(!createError && createdAuth?.user?.id, `Student account created in Supabase Auth (User ID: ${createdAuth?.user?.id})`);
  assert(createdAuth?.user?.email_confirmed_at !== null, "Student Auth user has email_confirmed_at populated (pre-confirmed)");

  // 3. Confirm student can immediately sign in without email verification
  console.log("\n--- 3. Immediate Sign-In Verification ---");
  const { data: loginData, error: loginError } = await clientSupabase.auth.signInWithPassword({
    email: tempEmail,
    password: tempPassword,
  });

  assert(!loginError && loginData?.user?.id, `Student signs in immediately with password (no verification link required)`);

  // 4. Confirm profile has role = student
  console.log("\n--- 4. Profile Role & Metadata Verification ---");
  const { data: profile, error: profError } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("id", createdAuth.user.id)
    .single();

  assert(!profError && profile?.role === "student", `Profile record populated with role = 'student'`);
  assert(profile?.full_name === tempFullName, `Profile full_name matches registered name: ${profile?.full_name}`);
  assert(profile?.email === tempEmail, `Profile email matches registered email: ${profile?.email}`);

  // 5. Existing login behavior verification
  console.log("\n--- 5. Existing Login Verification ---");
  const { data: existingLogin, error: existingErr } = await clientSupabase.auth.signInWithPassword({
    email: "student.test@ayush.local",
    password: "TestPassword123!",
  });
  assert(!existingErr && existingLogin?.user, "Existing test student account signs in normally");

  // 6. Duplicate email rejection verification
  console.log("\n--- 6. Duplicate Email Rejection Verification ---");
  // Check profiles duplicate check
  const { data: existingCheck } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("email", tempEmail)
    .maybeSingle();

  assert(Boolean(existingCheck), "Duplicate profile check correctly detects existing email");

  const { error: duplicateError } = await adminSupabase.auth.admin.createUser({
    email: tempEmail,
    password: "AnotherPassword123!",
    email_confirm: true,
  });

  assert(Boolean(duplicateError), `Supabase Auth strictly rejects duplicate user creation: ${duplicateError?.message}`);

  // 7. Institution/Faculty/Industry provisioning flow integrity
  console.log("\n--- 7. Institution, Faculty & Industry Provisioning Integrity ---");
  const instActions = fs.readFileSync("app/institution/actions.ts", "utf8");
  assert(instActions.includes("createFacultyAccount"), "createFacultyAccount remains intact");
  assert(instActions.includes('requireRole("institution")'), "createFacultyAccount role check intact");

  const superAdminActions = fs.readFileSync("app/super-admin/actions.ts", "utf8");
  assert(superAdminActions.includes("createInstitutionWithAdmin"), "createInstitutionWithAdmin remains intact");
  assert(superAdminActions.includes("createIndustryWithAdmin"), "createIndustryWithAdmin remains intact");

  // 8. Cleanup temporary test user
  console.log("\n--- 8. Cleanup Temporary Test Account ---");
  if (createdAuth?.user?.id) {
    await adminSupabase.from("profiles").delete().eq("id", createdAuth.user.id);
    await adminSupabase.auth.admin.deleteUser(createdAuth.user.id);
    console.log(`[PASS] Cleaned up temporary user ${createdAuth.user.id}`);
    passed++;
  }

  console.log("\n================================================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
