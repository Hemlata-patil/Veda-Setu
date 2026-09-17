import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

const BASE_URL = "http://localhost:5000/api";
const DB_URL = "postgresql://postgres:VedaSetu2026@localhost:5432/veda_setu";
const JWT_SECRET = "VedaSetu_2026_Local_JWT_Secret_ChangeMe_9284";

async function runLiveE2E() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 7C-8: LIVE FACULTY PORTAL E2E VERIFICATION SUITE");
  console.log("================================================================================\n");

  const pool = new Pool({ connectionString: DB_URL });
  const ts = Date.now();
  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (detail) console.log(`       ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (detail) console.error(`       ${detail}`);
      failed++;
    }
  }

  // Track created IDs for cleanup
  const createdUserIds = [];
  const createdInstIds = [];
  const createdOppIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES: Institutions, Faculty A & B, Student A & B, Industry User
    // -------------------------------------------------------------------------
    console.log("[SETUP] Preparing multi-tenant institutions and test accounts...");

    // 1. Institution A
    const instARes = await pool.query(
      `INSERT INTO public.institutions (name, code, location, category, verification_status)
       VALUES ($1, $2, $3, 'National Institute', 'approved')
       RETURNING id, name, code, location`,
      [`AIIA New Delhi ${ts}`, `AIIA-${ts}`, 'New Delhi, Delhi']
    );
    const instA = instARes.rows[0];
    createdInstIds.push(instA.id);

    // 2. Institution B
    const instBRes = await pool.query(
      `INSERT INTO public.institutions (name, code, location, category, verification_status)
       VALUES ($1, $2, $3, 'National Institute', 'approved')
       RETURNING id, name, code, location`,
      [`NIA Jaipur ${ts}`, `NIA-${ts}`, 'Jaipur, Rajasthan']
    );
    const instB = instBRes.rows[0];
    createdInstIds.push(instB.id);

    // Helper: Provision user account with bcrypt password
    async function provisionUser(email, password, fullName, role, institutionId) {
      const passwordHash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role`,
        [email, passwordHash, role]
      );
      const user = userRes.rows[0];
      createdUserIds.push(user.id);

      await pool.query(
        `INSERT INTO public.profiles (id, full_name, institution_id, department, designation)
         VALUES ($1, $2, $3, 'Ayurveda', 'Faculty/Student')
         ON CONFLICT (id) DO UPDATE SET full_name = $2, institution_id = $3`,
        [user.id, fullName, institutionId || null]
      );

      // Verify login via Express POST /api/auth/login
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.status !== 200 || !loginData.token) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(loginData)}`);
      }

      return { id: user.id, token: loginData.token, email, fullName, role };
    }

    // Provision Accounts
    const facultyA = await provisionUser(`faculty.a.${ts}@veda.test`, "TestPassword123!", `Prof. Faculty A ${ts}`, "faculty", instA.id);
    const facultyB = await provisionUser(`faculty.b.${ts}@veda.test`, "TestPassword123!", `Prof. Faculty B ${ts}`, "faculty", instB.id);
    const studentA = await provisionUser(`student.a.${ts}@veda.test`, "TestPassword123!", `Scholar Student A ${ts}`, "student", instA.id);
    const studentB = await provisionUser(`student.b.${ts}@veda.test`, "TestPassword123!", `Scholar Student B ${ts}`, "student", instB.id);
    const industryUser = await provisionUser(`industry.${ts}@veda.test`, "TestPassword123!", `Industry Rep ${ts}`, "industry", null);

    // Update specific department and designation details
    await pool.query("UPDATE public.profiles SET department = 'Kayachikitsa', designation = 'Professor' WHERE id = $1", [facultyA.id]);
    await pool.query("UPDATE public.profiles SET department = 'Dravyaguna', designation = 'Associate Professor' WHERE id = $1", [facultyB.id]);
    await pool.query("UPDATE public.profiles SET program = 'BAMS', year = 3 WHERE id = $1", [studentA.id]);
    await pool.query("UPDATE public.profiles SET program = 'MD Ayurveda', year = 1 WHERE id = $1", [studentB.id]);

    // Seed competency assessment for Student A
    const compRes = await pool.query("SELECT id FROM public.competencies LIMIT 2");
    if (compRes.rows.length > 0) {
      await pool.query(
        `INSERT INTO public.student_competencies (student_id, competency_id, proficiency_score, last_assessed_at, source, verified)
         VALUES ($1, $2, 85, NOW(), 'assessment', true)
         ON CONFLICT (student_id, competency_id) DO UPDATE SET proficiency_score = 85`,
        [studentA.id, compRes.rows[0].id]
      );
    }

    console.log(`[SETUP DONE] Faculty A @ ${instA.name}, Faculty B @ ${instB.name}\n`);

    // -------------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & ROLE BOUNDARIES
    // -------------------------------------------------------------------------
    console.log("--- 1. Authentication & Role Boundary Tests ---");

    // Test 1: Unauthenticated request to /api/faculty/dashboard -> 401
    const t1 = await fetch(`${BASE_URL}/faculty/dashboard`);
    assert(t1.status === 401, "Test 1: Unauthenticated request rejected with 401 Unauthorized");

    // Test 2: Student role calling /api/faculty/dashboard -> 403 Forbidden
    const t2 = await fetch(`${BASE_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    assert(t2.status === 403, "Test 2: Student role blocked from faculty dashboard with 403 Forbidden");

    // Test 3: Industry role calling /api/faculty/dashboard -> 403 Forbidden
    const t3 = await fetch(`${BASE_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${industryUser.token}` },
    });
    assert(t3.status === 403, "Test 3: Industry role blocked from faculty dashboard with 403 Forbidden");

    // Test 4: Student role calling /api/faculty/students -> 403 Forbidden
    const t4 = await fetch(`${BASE_URL}/faculty/students`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    assert(t4.status === 403, "Test 4: Student role blocked from faculty students directory (403 Forbidden)");

    // -------------------------------------------------------------------------
    // SECTION 2: FACULTY DASHBOARD SUMMARY & METRICS
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Faculty Dashboard Contract & Metrics Tests ---");

    const t5 = await fetch(`${BASE_URL}/faculty/dashboard`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t5Data = await t5.json();
    assert(
      t5.status === 200 &&
      t5Data.status === "success" &&
      t5Data.data.faculty.email === facultyA.email &&
      t5Data.data.institution.id === instA.id &&
      typeof t5Data.data.metrics.cohortStudentCount === "number" &&
      t5Data.data.metrics.cohortStudentCount >= 1,
      "Test 5: Faculty A retrieves authoritative dashboard summary with institution affiliation",
      `Cohort Count: ${t5Data.data?.metrics?.cohortStudentCount}, Inst: ${t5Data.data?.institution?.name}`
    );

    // Test 6: Recent students returned in dashboard
    assert(
      Array.isArray(t5Data.data.recentStudents) &&
      t5Data.data.recentStudents.some((s) => s.id === studentA.id),
      "Test 6: Faculty A dashboard recentStudents list includes enrolled Student A"
    );

    // -------------------------------------------------------------------------
    // SECTION 3: INSTITUTION COHORT DIRECTORY & MULTI-TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Institution Cohort Student Directory Tests ---");

    const t7 = await fetch(`${BASE_URL}/faculty/students`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t7Data = await t7.json();
    assert(
      t7.status === 200 &&
      t7Data.status === "success" &&
      Array.isArray(t7Data.data.students),
      "Test 7: Faculty A retrieves institution student directory",
      `Total Cohort Students: ${t7Data.results}`
    );

    // Test 8: Multi-tenant boundary check: Student A in list, Student B NOT in list
    const stuList = t7Data.data.students;
    const hasStudentA = stuList.some((s) => s.id === studentA.id);
    const hasStudentB = stuList.some((s) => s.id === studentB.id);
    assert(
      hasStudentA && !hasStudentB,
      "Test 8: Multi-Tenant Isolation — Faculty A only views Institution A students (Student B is excluded)"
    );

    // Test 9: Student item competency fields present
    const stuAItem = stuList.find((s) => s.id === studentA.id);
    assert(
      stuAItem &&
      typeof stuAItem.hasAssessment === "boolean" &&
      typeof stuAItem.priorityAreasCount === "number",
      "Test 9: Cohort student record provides verified competency indicators",
      `hasAssessment: ${stuAItem?.hasAssessment}, overallScore: ${stuAItem?.overallScore}, priorityAreas: ${stuAItem?.priorityAreasCount}`
    );

    // -------------------------------------------------------------------------
    // SECTION 4: STUDENT DETAIL & STRICT MULTI-TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Student Detail & Cross-Institution Boundary Tests ---");

    // Test 10: Faculty A views Student A detail (same institution) -> 200 OK
    const t10 = await fetch(`${BASE_URL}/faculty/students/${studentA.id}`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t10Data = await t10.json();
    assert(
      t10.status === 200 &&
      t10Data.status === "success" &&
      t10Data.data.student.id === studentA.id &&
      t10Data.data.student.institutionName === instA.name &&
      Array.isArray(t10Data.data.competencies),
      "Test 10: Faculty A successfully retrieves Student A skill profile and competencies",
      `Competencies Count: ${t10Data.data?.competencies?.length}`
    );

    // Test 11: CRITICAL SECURITY: Faculty A attempts to view Student B detail (Institution B) -> 403 Forbidden!
    const t11 = await fetch(`${BASE_URL}/faculty/students/${studentB.id}`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t11Data = await t11.json();
    assert(
      t11.status === 403 &&
      t11Data.status === "fail" &&
      t11Data.message.includes("institution"),
      "Test 11: Multi-Tenant Isolation — Faculty A blocked from accessing Student B from another institution (403 Forbidden)",
      `Error Message: "${t11Data.message}"`
    );

    // Test 12: Invalid UUID parameter returns 400 Bad Request
    const t12 = await fetch(`${BASE_URL}/faculty/students/not-a-valid-uuid`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    assert(t12.status === 400, "Test 12: Validation rejects malformed UUID with 400 Bad Request");

    // Test 13: Non-existent student UUID returns 404 Not Found
    const t13 = await fetch(`${BASE_URL}/faculty/students/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    assert(t13.status === 404, "Test 13: Non-existent student UUID returns 404 Not Found");

    // -------------------------------------------------------------------------
    // SECTION 5: FACULTY MENTORSHIP INTEGRATION
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Faculty Mentorship Lifecycle & Supervision Tests ---");

    // Test 14: Student A requests mentorship with Faculty A
    const t14 = await fetch(`${BASE_URL}/mentorship/student/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        facultyId: facultyA.id,
        requestNote: "Seeking clinical case guidance in Kayachikitsa",
      }),
    });
    const t14Data = await t14.json();
    const mentorshipId = t14Data.data?.id;
    assert(
      t14.status === 201 && Boolean(mentorshipId),
      "Test 14: Student A submits pending mentorship request to Faculty A",
      `Mentorship ID: ${mentorshipId}`
    );

    // Test 15: Faculty A pipeline lists the pending request
    const t15 = await fetch(`${BASE_URL}/mentorship/faculty`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t15Data = await t15.json();
    assert(
      t15.status === 200 &&
      t15Data.data.pendingRequests.some((r) => r.id === mentorshipId),
      "Test 15: Faculty A dashboard pipeline displays pending mentorship request"
    );

    // Test 16: Faculty B blocked from accepting Faculty A's student request -> 403
    const t16 = await fetch(`${BASE_URL}/mentorship/faculty/requests/${mentorshipId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyB.token}` },
    });
    assert(t16.status === 403, "Test 16: Non-assigned Faculty B blocked from accepting request (403 Forbidden)");

    // Test 17: Faculty A accepts request -> active
    const t17 = await fetch(`${BASE_URL}/mentorship/faculty/requests/${mentorshipId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    assert(t17.status === 200, "Test 17: Faculty A accepts mentorship request (status -> active)");

    // Test 18: Student detail now includes active mentorship record
    const t18 = await fetch(`${BASE_URL}/faculty/students/${studentA.id}`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t18Data = await t18.json();
    assert(
      t18.status === 200 &&
      t18Data.data.mentorship?.id === mentorshipId &&
      t18Data.data.mentorship?.status === "active",
      "Test 18: Student detail view reflects active mentorship supervision status"
    );

    // Test 19: Faculty A updates mentorship guidance note
    const t19 = await fetch(`${BASE_URL}/mentorship/faculty/mentees/${mentorshipId}/note`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyA.token}`,
      },
      body: JSON.stringify({ mentorNote: "Focus on classical diagnosis and patient history documentation." }),
    });
    assert(t19.status === 200, "Test 19: Faculty mentor successfully saves clinical guidance note");

    // Test 20: Faculty marks mentorship as completed
    const t20 = await fetch(`${BASE_URL}/mentorship/faculty/mentees/${mentorshipId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    assert(t20.status === 200, "Test 20: Faculty marks mentorship as completed (status -> completed)");

    // -------------------------------------------------------------------------
    // SECTION 6: FACULTY COLLABORATION OPPORTUNITIES
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Faculty Collaboration Discovery & Supervision Tests ---");

    // Test 21: Faculty A creates collaborative research opportunity
    const t21 = await fetch(`${BASE_URL}/faculty-collaboration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyA.token}`,
      },
      body: JSON.stringify({
        title: `Interdisciplinary Herbal Efficacy Trial ${ts}`,
        description: "Multi-center clinical trial on standardized Ashwagandha formulations with modern pharmacology.",
        opportunityType: "research_project",
        mode: "hybrid",
        location: "New Delhi",
        status: "published",
      }),
    });
    const t21Data = await t21.json();
    const oppId = t21Data.data?.id;
    if (oppId) createdOppIds.push(oppId);
    assert(
      t21.status === 201 && Boolean(oppId),
      "Test 21: Faculty A creates published inter-institutional collaboration opportunity",
      `Opportunity ID: ${oppId}`
    );

    // Test 22: Faculty B discovers published collaboration
    const t22 = await fetch(`${BASE_URL}/faculty-collaboration`, {
      headers: { Authorization: `Bearer ${facultyB.token}` },
    });
    const t22Data = await t22.json();
    assert(
      t22.status === 200 &&
      Array.isArray(t22Data.data) &&
      t22Data.data.some((o) => o.id === oppId),
      "Test 22: Faculty B discovers published opportunity in collaborative network"
    );

    // Test 23: Faculty B expresses interest
    const t23 = await fetch(`${BASE_URL}/faculty-collaboration/${oppId}/interest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyB.token}`,
      },
      body: JSON.stringify({
        message: "Our laboratory in NIA Jaipur can perform chromatographic fingerprinting.",
      }),
    });
    assert(t23.status === 201, "Test 23: Faculty B expresses interest in collaboration program");

    // Test 24: Faculty A reviews applicants
    const t24 = await fetch(`${BASE_URL}/faculty-collaboration/${oppId}/applicants`, {
      headers: { Authorization: `Bearer ${facultyA.token}` },
    });
    const t24Data = await t24.json();
    assert(
      t24.status === 200 &&
      Array.isArray(t24Data.data?.applicants) &&
      t24Data.data.applicants.some((i) => i.faculty?.id === facultyB.id),
      "Test 24: Opportunity author (Faculty A) successfully reviews applicant interests"
    );

    // Test 25: Non-author Faculty B blocked from reviewing applicants -> 403 Forbidden
    const t25 = await fetch(`${BASE_URL}/faculty-collaboration/${oppId}/applicants`, {
      headers: { Authorization: `Bearer ${facultyB.token}` },
    });
    assert(t25.status === 403, "Test 25: Non-author Faculty B blocked from reviewing program applicants (403 Forbidden)");

  } catch (err) {
    console.error("FATAL ERROR IN TEST EXECUTION:", err);
    failed++;
  } finally {
    // Cleanup created test records
    console.log("\n[CLEANUP] Cleaning up test fixtures from PostgreSQL...");
    try {
      if (createdOppIds.length > 0) {
        await pool.query("DELETE FROM public.faculty_opportunity_interests WHERE opportunity_id = ANY($1::uuid[])", [createdOppIds]);
        await pool.query("DELETE FROM public.faculty_opportunities WHERE id = ANY($1::uuid[])", [createdOppIds]);
      }
      if (createdUserIds.length > 0) {
        await pool.query("DELETE FROM public.mentorships WHERE faculty_id = ANY($1::uuid[]) OR student_id = ANY($1::uuid[])", [createdUserIds]);
        await pool.query("DELETE FROM public.student_competencies WHERE student_id = ANY($1::uuid[])", [createdUserIds]);
        await pool.query("DELETE FROM public.profiles WHERE id = ANY($1::uuid[])", [createdUserIds]);
        await pool.query("DELETE FROM public.users WHERE id = ANY($1::uuid[])", [createdUserIds]);
      }
      if (createdInstIds.length > 0) {
        await pool.query("DELETE FROM public.institutions WHERE id = ANY($1::uuid[])", [createdInstIds]);
      }
      console.log("[CLEANUP DONE] All test fixtures cleanly removed.");
    } catch (cleanErr) {
      console.error("Cleanup warning:", cleanErr.message);
    }
    await pool.end();
  }

  console.log("\n================================================================================");
  console.log(` MODULE 7C-8 LIVE E2E SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveE2E();
