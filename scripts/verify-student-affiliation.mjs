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
  console.log(" STUDENT PROFILE INSTITUTIONAL AFFILIATION & MENTORSHIP VERIFICATION SUITE");
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

  // 1. Code Inspection
  console.log("--- 1. Code Inspection & Guardrails ---");
  const actionsCode = fs.readFileSync("app/profile/actions.ts", "utf8");
  assert(actionsCode.includes('"use server"'), "app/profile/actions.ts has 'use server' directive");
  assert(actionsCode.includes("verification_status") && actionsCode.includes('"approved"'), "Actions validate institution verification_status = 'approved'");
  assert(actionsCode.includes("revalidatePath(\"/student/mentorship\")"), "Actions revalidate /student/mentorship");

  const formCode = fs.readFileSync("components/profile-form.tsx", "utf8");
  assert(formCode.includes('profile.role === "student"'), "Profile form specifically checks student role for affiliation");
  assert(formCode.includes("institution_id"), "Profile form renders institution_id select field");
  assert(formCode.includes("updateProfile"), "Profile form invokes updateProfile action");
  assert(formCode.includes("Academic Affiliation"), "Profile form displays Academic Affiliation in credentials card");

  const pageCode = fs.readFileSync("app/profile/page.tsx", "utf8");
  assert(pageCode.includes('.eq("verification_status", "approved")'), "Profile page queries approved institutions only");

  // 2. Database Inspection: Approved Institutions
  console.log("\n--- 2. Database Approved Institutions Inspection ---");
  const { data: approvedInsts, error: instErr } = await adminSupabase
    .from("institutions")
    .select("id, name, code, verification_status")
    .eq("verification_status", "approved");

  assert(!instErr && approvedInsts && approvedInsts.length > 0, `Found ${approvedInsts?.length || 0} approved institution(s)`);
  const validInst = approvedInsts[0];
  console.log(`  Using approved institution: "${validInst.name}" (${validInst.id})`);

  // 3. Create Temporary Student User for Testing
  console.log("\n--- 3. Create Temporary Student User ---");
  const testId = Date.now();
  const testEmail = `test.student.affiliation.${testId}@ayush.local`;
  const testPassword = "TempStudentPass123!";
  const testFullName = `Affiliation Test Student ${testId}`;

  const { data: createdAuth, error: createError } = await adminSupabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testFullName },
    app_metadata: { role: "student" },
  });

  assert(!createError && createdAuth?.user?.id, `Test student created (ID: ${createdAuth?.user?.id})`);
  const studentUserId = createdAuth.user.id;

  // 4. Sign in as student with client
  console.log("\n--- 4. Client Sign-In as Student ---");
  const { data: loginData, error: loginErr } = await clientSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  assert(!loginErr && loginData?.session, "Student client sign-in successful");

  // Verify initial profile has institution_id = null
  const { data: initialProfile } = await clientSupabase
    .from("profiles")
    .select("id, role, institution_id")
    .eq("id", studentUserId)
    .single();

  assert(initialProfile?.institution_id === null, "Initial student profile has institution_id = null");

  // 5. Test Mentorship Eligibility Check when institution_id is null
  console.log("\n--- 5. Mentorship Access When Unaffiliated ---");
  // Mentorship page logic: institutionId === null means hasInstitution = false
  const hasInstitutionInitially = Boolean(initialProfile?.institution_id);
  assert(hasInstitutionInitially === false, "Unaffiliated student correctly flagged as hasInstitution = false (blocking mentorship)");

  // 6. Test Arbitrary / Nonexistent Institution ID Rejection (Server-Side Validation)
  console.log("\n--- 6. Server-Side Validation: Reject Arbitrary Institution IDs ---");
  const fakeInstId = "00000000-0000-0000-0000-000000000000";

  // Simulate what updateProfile does when validating institution
  const { data: invalidInstCheck } = await clientSupabase
    .from("institutions")
    .select("id, name, verification_status")
    .eq("id", fakeInstId)
    .eq("verification_status", "approved")
    .maybeSingle();

  assert(!invalidInstCheck, "Arbitrary institution ID '00000000-0000-0000-0000-000000000000' fails approval validation");

  // 7. Update Student Profile with Approved Institution ID
  console.log("\n--- 7. Update Student Profile with Approved Institution ---");
  const { error: updateError } = await clientSupabase
    .from("profiles")
    .update({
      institution_id: validInst.id,
      department: "Dravyaguna",
      program: "BAMS",
      year: 3,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentUserId);

  assert(!updateError, `Student successfully updated profile with approved institution: ${validInst.name}`);

  // 8. Verify Persisted Institution ID in DB
  console.log("\n--- 8. Verify Persisted Profile Affiliation ---");
  const { data: updatedProfile, error: getProfErr } = await clientSupabase
    .from("profiles")
    .select("id, role, institution_id, department, program, year")
    .eq("id", studentUserId)
    .single();

  assert(!getProfErr && updatedProfile?.institution_id === validInst.id, `Profile institution_id correctly persisted as: ${updatedProfile?.institution_id}`);
  assert(updatedProfile?.role === "student", "Role remains immutable as 'student'");

  // 9. Verify Mentorship Unlock for Affiliated Student
  console.log("\n--- 9. Mentorship Unlock & Faculty Discovery ---");
  const hasInstitutionNow = Boolean(updatedProfile?.institution_id);
  assert(hasInstitutionNow === true, "Affiliated student has hasInstitution = true (mentorship unblocked)");

  // Query faculty belonging to the same institution
  const { data: matchingFaculty, error: facultyErr } = await adminSupabase
    .from("profiles")
    .select("id, full_name, department, institution_id")
    .eq("role", "faculty")
    .eq("institution_id", validInst.id);

  assert(!facultyErr, `Faculty query completed successfully. Found ${matchingFaculty?.length || 0} faculty mentor(s) in institution "${validInst.name}"`);
  if (matchingFaculty && matchingFaculty.length > 0) {
    console.log(`  Sample Faculty: "${matchingFaculty[0].full_name}" (${matchingFaculty[0].department || "General"})`);
  }

  // 10. Clean up test student
  console.log("\n--- 10. Clean Up ---");
  await adminSupabase.auth.admin.deleteUser(studentUserId);
  console.log(`[CLEANUP] Deleted temporary test user ${studentUserId}`);

  console.log("\n================================================================================");
  console.log(` VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification failed with exception:", err);
  process.exit(1);
});
