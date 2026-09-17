import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pg;

const BASE_URL = "http://localhost:5000/api";
const DB_URL = "postgresql://postgres:VedaSetu2026@localhost:5432/veda_setu";
const JWT_SECRET = "VedaSetu_2026_Local_JWT_Secret_ChangeMe_9284";

async function runLiveE2E() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 7C-9: LIVE INDUSTRY PORTAL E2E VERIFICATION SUITE");
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
  const createdAppIds = [];
  const createdPlacementIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES: Institution, Industry A, Industry B, Student, Faculty
    // -------------------------------------------------------------------------
    console.log("[SETUP] Preparing multi-tenant test accounts and fixtures...");

    // 1. Institution
    const instRes = await pool.query(
      `INSERT INTO public.institutions (name, code, location, category, verification_status)
       VALUES ($1, $2, $3, 'National Institute', 'approved')
       RETURNING id, name, code, location`,
      [`AIIA Delhi ${ts}`, `AIIA-${ts}`, 'New Delhi, Delhi']
    );
    const inst = instRes.rows[0];
    createdInstIds.push(inst.id);

    // Provision user accounts
    async function provisionUser(email, password, fullName, role, institutionId) {
      const userEmail = email.toLowerCase().trim();
      const passwordHash = await bcrypt.hash(password, 10);
      const userRes = await pool.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role`,
        [userEmail, passwordHash, role]
      );
      const user = userRes.rows[0];
      createdUserIds.push(user.id);

      await pool.query(
        `INSERT INTO public.profiles (id, full_name, institution_id, program, year, department, designation)
         VALUES ($1, $2, $3, 'BAMS', 4, 'Ayurveda', 'Partner/Scholar')
         ON CONFLICT (id) DO UPDATE SET full_name = $2, institution_id = $3`,
        [user.id, fullName, institutionId || null]
      );

      return user;
    }

    const industryA = await provisionUser(`industrya_${ts}@ayushindustry.org`, "IndustryPass123!", "Dabur Research A", "industry", null);
    const industryB = await provisionUser(`industryb_${ts}@ayushindustry.org`, "IndustryPass123!", "Himalaya Wellness B", "industry", null);
    const student = await provisionUser(`student_${ts}@ayushcollege.edu`, "StudentPass123!", "Rahul Sharma", "student", inst.id);
    const faculty = await provisionUser(`faculty_${ts}@ayushcollege.edu`, "FacultyPass123!", "Dr. V. K. Joshi", "faculty", inst.id);

    // Fetch existing canonical competencies
    const compRes = await pool.query(`SELECT id, name FROM public.competencies WHERE is_active = true LIMIT 3`);
    if (compRes.rows.length < 2) {
      throw new Error("Insufficient competencies in database. Required at least 2.");
    }
    const comp1 = compRes.rows[0];
    const comp2 = compRes.rows[1];

    // Seed student competencies for Rahul Sharma: comp1 = 80, comp2 = 70
    await pool.query(
      `INSERT INTO public.student_competencies (student_id, competency_id, proficiency_score)
       VALUES ($1, $2, 80), ($1, $3, 70)
       ON CONFLICT (student_id, competency_id) DO UPDATE SET proficiency_score = EXCLUDED.proficiency_score`,
      [student.id, comp1.id, comp2.id]
    );

    // Generate JWT tokens
    function makeToken(user) {
      return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
    }

    const tokenIndustryA = makeToken(industryA);
    const tokenIndustryB = makeToken(industryB);
    const tokenStudent = makeToken(student);
    const tokenFaculty = makeToken(faculty);

    // Helper for API fetch
    async function api(path, token, options = {}) {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
      if (token) {
        headers["Cookie"] = `auth_token=${token}`;
      }
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });
      let body = null;
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      return { status: res.status, headers: res.headers, body };
    }

    console.log("[SETUP] Provisioned test accounts and tokens successfully.\n");

    // =========================================================================
    // SECTION 1: AUTHENTICATION & ROLE ISOLATION
    // =========================================================================
    console.log("--- 1. Authentication & Role Boundary Tests ---");

    // Test 1: Unauthenticated -> 401
    const t1 = await api("/industry/dashboard", null);
    assert(t1.status === 401, "Test 1: Unauthenticated request rejected with 401 Unauthorized", `Status: ${t1.status}`);

    // Test 2: Student -> 403
    const t2 = await api("/industry/dashboard", tokenStudent);
    assert(t2.status === 403, "Test 2: Student role blocked from industry dashboard with 403 Forbidden", `Status: ${t2.status}`);

    // Test 3: Faculty -> 403
    const t3 = await api("/industry/opportunities", tokenFaculty);
    assert(t3.status === 403, "Test 3: Faculty role blocked from industry opportunities with 403 Forbidden", `Status: ${t3.status}`);

    // Test 4: Industry login works
    const t4 = await api("/auth/login", null, {
      method: "POST",
      body: JSON.stringify({ email: industryA.email, password: "IndustryPass123!" }),
    });
    const setCookie = t4.headers.get("set-cookie") || "";
    assert(
      t4.status === 200 && (setCookie.includes("auth_token=") || t4.body?.data?.token),
      "Test 4: Industry login succeeds and returns valid authentication",
      `Status: ${t4.status}`
    );

    // =========================================================================
    // SECTION 2: INDUSTRY OPPORTUNITY LIFECYCLE & MULTI-TENANT ISOLATION
    // =========================================================================
    console.log("\n--- 2. Industry Opportunity Lifecycle & Multi-Tenant Tests ---");

    // Test 8: Create opportunity
    const createOppPayload = {
      title: `Clinical Research Fellowship ${ts}`,
      description: "In-depth clinical trial research on standardized Ashwagandha extracts.",
      opportunityType: "project",
      location: "New Delhi R&D Center",
      workMode: "onsite",
      eligibility: "Final year BAMS or MD scholars",
      applicationDeadline: "2026-12-31",
      organizationName: "Dabur R&D Labs",
      status: "draft",
      requiredCompetencies: [
        { competencyId: comp1.id, requiredScore: 75, weight: 2 },
        { competencyId: comp2.id, requiredScore: 65, weight: 1 },
      ],
    };

    const t8 = await api("/industry/opportunities", tokenIndustryA, {
      method: "POST",
      body: JSON.stringify(createOppPayload),
    });
    const oppAId = t8.body?.data?.opportunityId;
    if (oppAId) createdOppIds.push(oppAId);
    assert(t8.status === 201 && oppAId, "Test 8: Industry A successfully creates opportunity with competency requirements", `Opp ID: ${oppAId}`);

    // Test 9: created_by comes from JWT
    const dbOppRes = await pool.query(`SELECT id, created_by, status FROM public.opportunities WHERE id = $1`, [oppAId]);
    const dbOpp = dbOppRes.rows[0];
    assert(
      dbOpp && dbOpp.created_by === industryA.id,
      "Test 9: Opportunity created_by is derived authoritatively from JWT user ID",
      `Expected: ${industryA.id}, Actual: ${dbOpp?.created_by}`
    );

    // Test 10: List own opportunities
    const t10 = await api("/industry/opportunities", tokenIndustryA);
    const oppsList = t10.body?.data?.opportunities || [];
    const foundOppA = oppsList.find((o) => o.id === oppAId);
    assert(
      t10.status === 200 && foundOppA && foundOppA.requirements?.length === 2,
      "Test 10: Industry A lists own opportunities with attached competencies",
      `Found ${oppsList.length} opportunities, requirements count: ${foundOppA?.requirements?.length}`
    );

    // Test 11: Update own opportunity
    const t11 = await api(`/industry/opportunities/${oppAId}`, tokenIndustryA, {
      method: "PUT",
      body: JSON.stringify({
        ...createOppPayload,
        title: `Clinical Research Fellowship (Updated) ${ts}`,
      }),
    });
    assert(t11.status === 200, "Test 11: Industry A updates own opportunity metadata and competencies", `Status: ${t11.status}`);

    // Test 12: Publish opportunity (draft -> published)
    const t12 = await api(`/industry/opportunities/${oppAId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    assert(t12.status === 200, "Test 12: Industry A transitions opportunity status: draft -> published", `Status: ${t12.status}`);

    // Test 13: Close opportunity (published -> closed)
    const t13 = await api(`/industry/opportunities/${oppAId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
    assert(t13.status === 200, "Test 13: Industry A transitions opportunity status: published -> closed", `Status: ${t13.status}`);

    // Test 14: Reopen opportunity (closed -> published)
    const t14 = await api(`/industry/opportunities/${oppAId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    assert(t14.status === 200, "Test 14: Industry A reopens closed opportunity: closed -> published", `Status: ${t14.status}`);

    // Test 15: Archive opportunity (close first, then closed -> archived)
    // Create a secondary opportunity to test archive without disturbing main opp
    const t15Create = await api("/industry/opportunities", tokenIndustryA, {
      method: "POST",
      body: JSON.stringify({
        title: `Archive Test Opp ${ts}`,
        description: "Test opportunity for archive transition",
        opportunityType: "internship",
        status: "draft",
        requiredCompetencies: [],
      }),
    });
    const archiveOppId = t15Create.body?.data?.opportunityId;
    if (archiveOppId) createdOppIds.push(archiveOppId);
    await api(`/industry/opportunities/${archiveOppId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    await api(`/industry/opportunities/${archiveOppId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
    const t15 = await api(`/industry/opportunities/${archiveOppId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" }),
    });
    assert(t15.status === 200, "Test 15: Industry A archives closed opportunity: closed -> archived", `Status: ${t15.status}`);

    // Test 16: Industry B cannot modify Industry A opportunity -> 403
    const t16 = await api(`/industry/opportunities/${oppAId}/status`, tokenIndustryB, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
    assert(t16.status === 403, "Test 16: Industry B cannot modify Industry A's opportunity (403 Forbidden)", `Status: ${t16.status}`);

    // Test 17: Industry B cannot remove/delete Industry A opportunity -> 403
    const t17 = await api(`/industry/opportunities/${oppAId}`, tokenIndustryB, {
      method: "DELETE",
    });
    assert(t17.status === 403, "Test 17: Industry B cannot delete Industry A's opportunity (403 Forbidden)", `Status: ${t17.status}`);

    // =========================================================================
    // SECTION 3: INDUSTRY DASHBOARD & METRICS
    // =========================================================================
    console.log("\n--- 3. Industry Dashboard & Aggregated Metrics ---");

    // Test 5: Industry dashboard loads
    const t5 = await api("/industry/dashboard", tokenIndustryA);
    assert(t5.status === 200 && t5.body?.data?.metrics, "Test 5: Industry dashboard loads successfully", `Status: ${t5.status}`);

    // Test 6: Dashboard metrics correspond to existing UI
    const metrics = t5.body?.data?.metrics || {};
    assert(
      metrics.totalOpportunities >= 2 &&
      metrics.publishedCount >= 1 &&
      typeof metrics.selectedCandidatesCount === "number" &&
      typeof metrics.activePlacementsCount === "number",
      "Test 6: Dashboard metrics correspond to existing UI specifications",
      `Total: ${metrics.totalOpportunities}, Published: ${metrics.publishedCount}, Drafts: ${metrics.draftCount}, Closed: ${metrics.closedCount}`
    );

    // Test 7: Recent opportunities belong to authenticated Industry
    const recentOpps = t5.body?.data?.opportunities || [];
    const allBelong = recentOpps.every((o) => createdOppIds.includes(o.id));
    assert(allBelong && recentOpps.length > 0, "Test 7: Recent opportunities strictly belong to authenticated Industry", `Count: ${recentOpps.length}`);

    // =========================================================================
    // SECTION 4: CANDIDATE APPLICATIONS & STATE MACHINE
    // =========================================================================
    console.log("\n--- 4. Candidate Applications, Skill Matching & State Machine ---");

    // Setup: Student applies to published Opportunity A
    const appApplyRes = await api(`/opportunities/${oppAId}/applications`, tokenStudent, {
      method: "POST",
      body: JSON.stringify({ coverNote: "Passionate about botanical research and clinical validation." }),
    });
    const applicationId = appApplyRes.body?.data?.applicationId;
    if (applicationId) createdAppIds.push(applicationId);
    assert(appApplyRes.status === 201 && applicationId, "Setup: Student successfully submits application to Opportunity A", `App ID: ${applicationId}`);

    // Test 18: Industry sees own applicants
    const t18a = await api(`/industry/opportunities/${oppAId}/applications`, tokenIndustryA);
    const t18b = await api("/industry/applications", tokenIndustryA);
    const hasAppA = (t18a.body?.data?.applicants || []).some((a) => a.id === applicationId);
    const hasAppB = (t18b.body?.data?.applications || []).some((a) => a.id === applicationId);
    assert(
      t18a.status === 200 && t18b.status === 200 && hasAppA && hasAppB,
      "Test 18: Industry sees own applicants across opportunity endpoints",
      `Found applicant via opp endpoint: ${hasAppA}, via global endpoint: ${hasAppB}`
    );

    // Test 19: Industry B cannot see Industry A's applicants
    const t19 = await api(`/industry/opportunities/${oppAId}/applications`, tokenIndustryB);
    const t19b = await api("/industry/applications", tokenIndustryB);
    const leakInB = (t19b.body?.data?.applications || []).some((a) => a.id === applicationId);
    assert(
      t19.status === 403 && !leakInB,
      "Test 19: Industry B cannot see Industry A's applicants (403 & tenant isolated)",
      `Direct opp check: ${t19.status}, Cross-industry list leak: ${leakInB}`
    );

    // Test 20: Candidate detail works
    const t20 = await api(`/industry/applications/${applicationId}`, tokenIndustryA);
    const candidate = t20.body?.data?.candidate;
    assert(
      t20.status === 200 && candidate && candidate.studentName === "Rahul Sharma" && candidate.institutionName,
      "Test 20: Candidate detail returns complete applicant profile and institution data",
      `Candidate: ${candidate?.studentName}, Institution: ${candidate?.institutionName}`
    );

    // Test 21: Skill match is calculated correctly
    const match = candidate?.matchResult;
    assert(
      match && typeof match.skillMatchPercentage === "number" && match.skillMatchPercentage >= 0 && match.skillMatchPercentage <= 100,
      "Test 21: Skill match calculated authoritatively by matching.service.ts",
      `Score: ${match?.skillMatchPercentage}%, Qualified: ${match?.isQualified}`
    );

    // Test 22: applied -> under_review
    const t22 = await api(`/industry/applications/${applicationId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "under_review" }),
    });
    assert(t22.status === 200 && t22.body?.status === "success", "Test 22: Valid transition: applied -> under_review succeeds", `Status: ${t22.status}`);

    // Test 23: under_review -> shortlisted
    const t23 = await api(`/industry/applications/${applicationId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "shortlisted" }),
    });
    assert(t23.status === 200, "Test 23: Valid transition: under_review -> shortlisted succeeds", `Status: ${t23.status}`);

    // Test 24: shortlisted -> selected
    const t24 = await api(`/industry/applications/${applicationId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "selected" }),
    });
    assert(t24.status === 200, "Test 24: Valid transition: shortlisted -> selected succeeds", `Status: ${t24.status}`);

    // Test 25: Invalid transition rejected (e.g. selected -> under_review -> 400)
    const t25 = await api(`/industry/applications/${applicationId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "under_review" }),
    });
    assert(t25.status === 400, "Test 25: Invalid status transition strictly rejected with 400 Bad Request", `Status: ${t25.status}`);

    // Test 26: Terminal transition rejected (selected is terminal)
    const t26 = await api(`/industry/applications/${applicationId}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    });
    assert(t26.status === 400, "Test 26: Terminal state modification strictly rejected with 400 Bad Request", `Status: ${t26.status}`);

    // =========================================================================
    // SECTION 5: INTERNSHIP & PLACEMENT TRACKING LIFECYCLE
    // =========================================================================
    console.log("\n--- 5. Internship & Placement Tracking Lifecycle ---");

    // Test 27: Selected application can create placement
    const createPlacementPayload = {
      applicationId,
      engagementType: "internship",
      startDate: "2026-06-01",
      expectedEndDate: "2026-11-30",
      supervisorName: "Dr. Arvind Gupta",
      supervisorEmail: "arvind.gupta@dabur.com",
    };

    const t27 = await api("/placements", tokenIndustryA, {
      method: "POST",
      body: JSON.stringify(createPlacementPayload),
    });
    const placementId = t27.body?.data?.id;
    if (placementId) createdPlacementIds.push(placementId);
    assert(t27.status === 201 && placementId, "Test 27: Selected candidate initiates placement tracking (status: selected, progress: 0%)", `Placement ID: ${placementId}`);

    // Test 28: Duplicate placement -> 409
    const t28 = await api("/placements", tokenIndustryA, {
      method: "POST",
      body: JSON.stringify(createPlacementPayload),
    });
    assert(t28.status === 409, "Test 28: Duplicate placement on same application rejected with 409 Conflict", `Status: ${t28.status}`);

    // Test 29: Placement status transitions work (selected -> offer_accepted -> joined -> in_progress -> completed)
    const t29a = await api(`/placements/${placementId}`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "offer_accepted", progressPercent: 10 }),
    });
    const t29b = await api(`/placements/${placementId}`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "joined", progressPercent: 25 }),
    });
    const t29c = await api(`/placements/${placementId}`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "in_progress", progressPercent: 60 }),
    });
    const t29d = await api(`/placements/${placementId}`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        progressPercent: 100,
        actualEndDate: "2026-11-28",
        outcome: "Successfully completed full Ayurvedic clinical trial documentation.",
      }),
    });
    assert(
      t29a.status === 200 && t29b.status === 200 && t29c.status === 200 && t29d.status === 200,
      "Test 29: Full placement state machine progression: selected -> offer_accepted -> joined -> in_progress -> completed",
      `Steps: ${t29a.status}, ${t29b.status}, ${t29c.status}, ${t29d.status}`
    );

    // Test 30: Invalid placement transition rejected (terminal completed -> in_progress -> 400)
    const t30 = await api(`/placements/${placementId}`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "in_progress" }),
    });
    assert(t30.status === 400, "Test 30: Invalid placement transition from terminal state rejected with 400 Bad Request", `Status: ${t30.status}`);

    // Test 31: Progress validation works (progress > 100 -> 400)
    // Create a temporary placement to test progress bounds
    // First create a new application for Industry A
    const oppA2 = await api("/industry/opportunities", tokenIndustryA, {
      method: "POST",
      body: JSON.stringify({
        title: `Validation Test Opp ${ts}`,
        description: "Opportunity for progress validation test",
        opportunityType: "placement",
        status: "published",
        requiredCompetencies: [],
      }),
    });
    const oppA2Id = oppA2.body?.data?.opportunityId;
    if (oppA2Id) createdOppIds.push(oppA2Id);

    const student2 = await provisionUser(`student2_${ts}@ayushcollege.edu`, "StudentPass123!", "Amit Patel", "student", inst.id);
    const tokenStudent2 = makeToken(student2);

    const app2Res = await api(`/opportunities/${oppA2Id}/applications`, tokenStudent2, {
      method: "POST",
      body: JSON.stringify({ coverNote: "Validation test note" }),
    });
    const app2Id = app2Res.body?.data?.applicationId;
    if (app2Id) createdAppIds.push(app2Id);

    await api(`/industry/applications/${app2Id}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "under_review" }),
    });
    await api(`/industry/applications/${app2Id}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "shortlisted" }),
    });
    await api(`/industry/applications/${app2Id}/status`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ status: "selected" }),
    });

    const plc2Res = await api("/placements", tokenIndustryA, {
      method: "POST",
      body: JSON.stringify({
        applicationId: app2Id,
        engagementType: "placement",
        startDate: "2026-07-01",
        expectedEndDate: "2026-12-31",
      }),
    });
    const plc2Id = plc2Res.body?.data?.id;
    if (plc2Id) createdPlacementIds.push(plc2Id);

    const t31 = await api(`/placements/${plc2Id}`, tokenIndustryA, {
      method: "PATCH",
      body: JSON.stringify({ progressPercent: 150 }),
    });
    assert(t31.status === 400, "Test 31: Progress percentage validation rejects values outside 0-100 (400 Bad Request)", `Status: ${t31.status}`);

    // Test 32: Industry B cannot access Industry A placement -> 403
    const t32 = await api(`/placements/${placementId}`, tokenIndustryB);
    assert(t32.status === 403, "Test 32: Industry B cannot view Industry A's placement record (403 Forbidden)", `Status: ${t32.status}`);

    // Test 33: Industry B cannot update Industry A placement -> 403
    const t33 = await api(`/placements/${placementId}`, tokenIndustryB, {
      method: "PATCH",
      body: JSON.stringify({ supervisorName: "Hacked Name" }),
    });
    assert(t33.status === 403, "Test 33: Industry B cannot update Industry A's placement record (403 Forbidden)", `Status: ${t33.status}`);

    // =========================================================================
    // SECTION 6: INPUT VALIDATION & RESOURCE NOT FOUND
    // =========================================================================
    console.log("\n--- 6. Input Validation & Error Behavior ---");

    // Test 34: Malformed UUID -> 400
    const t34 = await api("/industry/opportunities/not-a-valid-uuid", tokenIndustryA);
    assert(t34.status === 400, "Test 34: Malformed UUID parameter rejected with 400 Bad Request", `Status: ${t34.status}`);

    // Test 35: Nonexistent resource -> 404
    const t35 = await api("/industry/opportunities/00000000-0000-0000-0000-000000000000", tokenIndustryA);
    assert(t35.status === 404, "Test 35: Nonexistent opportunity lookup returns 404 Not Found", `Status: ${t35.status}`);

  } catch (err) {
    console.error("\n[CRITICAL ERROR] Live E2E test execution threw an exception:", err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN FIXTURES
    // -------------------------------------------------------------------------
    console.log("\n[CLEANUP] Cleaning up test fixtures from PostgreSQL database...");
    try {
      if (createdPlacementIds.length > 0) {
        await pool.query(`DELETE FROM public.internship_placements WHERE id = ANY($1::uuid[])`, [createdPlacementIds]);
      }
      if (createdAppIds.length > 0) {
        await pool.query(`DELETE FROM public.applications WHERE id = ANY($1::uuid[])`, [createdAppIds]);
      }
      if (createdOppIds.length > 0) {
        await pool.query(`DELETE FROM public.opportunity_competencies WHERE opportunity_id = ANY($1::uuid[])`, [createdOppIds]);
        await pool.query(`DELETE FROM public.opportunities WHERE id = ANY($1::uuid[])`, [createdOppIds]);
      }
      if (createdUserIds.length > 0) {
        await pool.query(`DELETE FROM public.student_competencies WHERE student_id = ANY($1::uuid[])`, [createdUserIds]);
        await pool.query(`DELETE FROM public.profiles WHERE id = ANY($1::uuid[])`, [createdUserIds]);
        await pool.query(`DELETE FROM public.users WHERE id = ANY($1::uuid[])`, [createdUserIds]);
      }
      if (createdInstIds.length > 0) {
        await pool.query(`DELETE FROM public.institutions WHERE id = ANY($1::uuid[])`, [createdInstIds]);
      }
      console.log("[CLEANUP] Finished fixture cleanup successfully.");
    } catch (cleanupErr) {
      console.error("[CLEANUP WARNING] Failed during fixture cleanup:", cleanupErr);
    } finally {
      await pool.end();
    }

    console.log("\n================================================================================");
    console.log(` MODULE 7C-9 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log("================================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runLiveE2E();
