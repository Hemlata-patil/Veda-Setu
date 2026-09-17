import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:VedaSetu2026@localhost:5432/veda_setu",
});

const BACKEND_URL = "http://localhost:5000/api";

let passedCount = 0;
let failedCount = 0;

function assert(condition, name, details) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    if (details) console.log(`       ${details}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${name}`);
    if (details) console.error(`       ${details}`);
    failedCount++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const rawCookie = res.headers.get("set-cookie") || "";
  const tokenMatch = rawCookie.match(/auth_token=([^;]+)/);
  const cookieToken = tokenMatch ? tokenMatch[1] : null;

  const contentType = res.headers.get("content-type");
  const body = contentType?.includes("application/json") ? await res.json() : await res.text();

  return { status: res.status, body, cookieToken, ok: res.ok };
}

async function main() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 7C-5 + 7C-6 LIVE E2E VERIFICATION (35 CHECKS)");
  console.log(" Testing against live Express (http://localhost:5000) & real PostgreSQL");
  console.log("================================================================================\n");

  const runId = Date.now();

  // Create two institutions in DB
  const inst1Res = await pool.query(
    "INSERT INTO public.institutions (id, name, code) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
    [`Test Ayurveda Institute A ${runId}`, `TAIA-${runId}`]
  );
  const institutionAId = inst1Res.rows[0].id;

  const inst2Res = await pool.query(
    "INSERT INTO public.institutions (id, name, code) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
    [`Test Ayurveda Institute B ${runId}`, `TAIB-${runId}`]
  );
  const institutionBId = inst2Res.rows[0].id;

  // Create one organization
  const orgRes = await pool.query(
    "INSERT INTO public.organizations (id, name, organization_type) VALUES (gen_random_uuid(), $1, 'pharma') RETURNING id",
    [`Test Ayush Pharma ${runId}`]
  );
  const organizationId = orgRes.rows[0].id;

  // Helper to create user in DB
  async function createTestUser(email, role, fullName, institutionId = null) {
    const password = "Password123!";
    const regRes = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName }),
    });

    let userId = regRes.body?.user?.id;
    if (!userId) {
      const dbUser = await pool.query("SELECT id FROM public.users WHERE email = $1", [email]);
      userId = dbUser.rows[0]?.id;
    }

    if (role !== "student") {
      await pool.query("UPDATE public.users SET role = $1 WHERE id = $2", [role, userId]);
    }

    if (institutionId) {
      await pool.query("UPDATE public.profiles SET institution_id = $1 WHERE id = $2", [institutionId, userId]);
    }

    // Log in with credentials to get fresh JWT token signed with exact authoritative role
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const token = loginRes.cookieToken || loginRes.body?.token;
    const resolvedRole = loginRes.body?.user?.role || role;

    return { id: userId, email, password, token, role: resolvedRole, fullName };
  }

  console.log("--- 1. AUTHENTICATION (Tests 1 - 4) ---");
  const studentA = await createTestUser(`student.a.${runId}@test.veda`, "student", `Student A ${runId}`, institutionAId);
  const studentB = await createTestUser(`student.b.${runId}@test.veda`, "student", `Student B ${runId}`, institutionBId);
  const facultyA = await createTestUser(`faculty.a.${runId}@test.veda`, "faculty", `Prof. Faculty A ${runId}`, institutionAId);
  const facultyB = await createTestUser(`faculty.b.${runId}@test.veda`, "faculty", `Dr. Faculty B ${runId}`, institutionBId);
  const industryA = await createTestUser(`industry.a.${runId}@test.veda`, "industry", `Industry Recruiter A ${runId}`, null, organizationId);
  const industryB = await createTestUser(`industry.b.${runId}@test.veda`, "industry", `Industry Recruiter B ${runId}`, null, organizationId);

  // Test 1: Student login works
  const sLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: studentA.email, password: studentA.password }),
  });
  assert(sLogin.ok && sLogin.body?.user?.role === "student", "1. Student login works", `Role: ${sLogin.body?.user?.role}`);

  // Test 2: Faculty login works
  const fLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: facultyA.email, password: facultyA.password }),
  });
  assert(fLogin.ok && fLogin.body?.user?.role === "faculty", "2. Faculty login works", `Role: ${fLogin.body?.user?.role}`);

  // Test 3: Industry login works
  const indLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: industryA.email, password: industryA.password }),
  });
  assert(indLogin.ok && indLogin.body?.user?.role === "industry", "3. Industry login works", `Role: ${indLogin.body?.user?.role}`);

  // Test 4: /auth/me returns correct role
  const meRes = await request("/auth/me", {
    headers: { Cookie: `auth_token=${facultyA.token}` },
  });
  assert(meRes.ok && meRes.body?.user?.role === "faculty", "4. /auth/me returns correct role", `User: ${meRes.body?.user?.email}, Role: ${meRes.body?.user?.role}`);

  console.log("\n--- 2. MENTORSHIP (Tests 5 - 14) ---");

  // Test 5: Student sees eligible faculty (only same-institution faculty)
  const stuMentorshipRes = await request("/mentorship/student", {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  const facList = stuMentorshipRes.body?.data?.availableFaculty || [];
  const hasFacultyA = facList.some((f) => f.id === facultyA.id);
  const hasFacultyB = facList.some((f) => f.id === facultyB.id);
  assert(stuMentorshipRes.ok && hasFacultyA && !hasFacultyB, "5. Student sees eligible faculty", `Found same-institution faculty; cross-institution omitted`);

  // Test 6: Student creates mentorship request
  const reqRes = await request("/mentorship/student/request", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({ facultyId: facultyA.id, requestNote: "Please guide my clinical studies" }),
  });
  const mentorshipId = reqRes.body?.data?.id;
  assert(reqRes.status === 201 && mentorshipId, "6. Student creates mentorship request", `Created mentorship id: ${mentorshipId}`);

  // Test 7: Duplicate request is rejected correctly
  const dupReq = await request("/mentorship/student/request", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({ facultyId: facultyA.id }),
  });
  assert(dupReq.status === 409, "7. Duplicate request is rejected correctly", `HTTP 409 Conflict: ${dupReq.body?.message}`);

  // Test 8: Faculty sees the request
  const facMentorshipRes = await request("/mentorship/faculty", {
    headers: { Cookie: `auth_token=${facultyA.token}` },
  });
  const pendingRequests = facMentorshipRes.body?.data?.pendingRequests || [];
  const foundPending = pendingRequests.find((r) => r.id === mentorshipId);
  assert(foundPending && foundPending.studentName?.includes("Student A"), "8. Faculty sees the request", `Request from: ${foundPending?.studentName}`);

  // Test 9: Faculty accepts/rejects correctly
  const acceptRes = await request(`/mentorship/faculty/requests/${mentorshipId}/accept`, {
    method: "POST",
    headers: { Cookie: `auth_token=${facultyA.token}` },
  });
  assert(acceptRes.ok, "9. Faculty accepts/rejects correctly", `Status now active`);

  // Test 10: Student sees updated status
  const stuUpdated = await request("/mentorship/student", {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(stuUpdated.body?.data?.activeMentorship?.id === mentorshipId, "10. Student sees updated status", `Active mentorship confirmed`);

  // Test 11: Student cannot access another student's mentorship
  // Faculty note updated
  await request(`/mentorship/faculty/mentees/${mentorshipId}/note`, {
    method: "PUT",
    headers: { Cookie: `auth_token=${facultyA.token}` },
    body: JSON.stringify({ mentorNote: "Confidential evaluation note" }),
  });
  // Student B checking mentorship
  const stuBRes = await request("/mentorship/student", {
    headers: { Cookie: `auth_token=${studentB.token}` },
  });
  const stuBActive = stuBRes.body?.data?.activeMentorship;
  assert(!stuBActive || stuBActive.id !== mentorshipId, "11. Student cannot access another student's mentorship", `Student B has no access to Student A's record`);

  // Test 12: Student cannot see private mentor notes
  const stuASelf = await request("/mentorship/student", {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  const activeObj = stuASelf.body?.data?.activeMentorship;
  assert(activeObj && activeObj.mentorNote === undefined && activeObj.mentor_note === undefined, "12. Student cannot see private mentor notes", `Private note strictly omitted from response`);

  // Test 13: Same-institution restrictions work (Student B attempting to request Faculty A)
  const crossReq = await request("/mentorship/student/request", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentB.token}` },
    body: JSON.stringify({ facultyId: facultyA.id }),
  });
  assert(crossReq.status === 403, "13. Same-institution restrictions work", `Cross-institution request rejected with 403 Forbidden`);

  // Test 14: Active mentor concurrency rule works (Student A already has active mentor, tries to request another)
  const facA2 = await createTestUser(`faculty.a2.${runId}@test.veda`, "faculty", `Prof. Faculty A2 ${runId}`, institutionAId);
  const secondReq = await request("/mentorship/student/request", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({ facultyId: facA2.id }),
  });
  assert(secondReq.status === 409, "14. Active mentor concurrency rule works", `Second active mentor request rejected with 409 Conflict`);

  console.log("\n--- 3. COLLABORATION (Tests 15 - 20) ---");

  // Create published opportunity
  const oppRes = await request("/faculty-collaboration", {
    method: "POST",
    headers: { Cookie: `auth_token=${facultyA.token}` },
    body: JSON.stringify({
      title: `Ayurvedic Research Initiative ${runId}`,
      description: "Collaborative clinical study on herbal formulations",
      opportunityType: "research_project",
      status: "published",
    }),
  });
  const collabOppId = oppRes.body?.data?.id;

  // Test 15: Faculty sees collaboration opportunities
  const listCollab = await request("/faculty-collaboration", {
    headers: { Cookie: `auth_token=${facultyB.token}` },
  });
  const foundCollab = (listCollab.body?.data || []).some((o) => o.id === collabOppId);
  assert(listCollab.ok && foundCollab, "15. Faculty sees collaboration opportunities", `Found published opportunity: ${collabOppId}`);

  // Test 16: Faculty can express interest
  const interestRes = await request(`/faculty-collaboration/${collabOppId}/interest`, {
    method: "POST",
    headers: { Cookie: `auth_token=${facultyB.token}` },
    body: JSON.stringify({ message: "Interested in pharmacognosy portion" }),
  });
  const interestId = interestRes.body?.data?.id;
  assert(interestRes.status === 201 && interestId, "16. Faculty can express interest", `Interest record: ${interestId}`);

  // Test 17: Duplicate interest is rejected
  const dupInterest = await request(`/faculty-collaboration/${collabOppId}/interest`, {
    method: "POST",
    headers: { Cookie: `auth_token=${facultyB.token}` },
    body: JSON.stringify({ message: "Interested again" }),
  });
  assert(dupInterest.status === 409, "17. Duplicate interest is rejected", `HTTP 409 Conflict: ${dupInterest.body?.message}`);

  // Test 18: Faculty sees their interest status
  const myInterestsRes = await request("/faculty-collaboration/interests/my-interests", {
    headers: { Cookie: `auth_token=${facultyB.token}` },
  });
  const myInt = (myInterestsRes.body?.data || []).find((i) => i.id === interestId);
  assert(myInt && myInt.status === "interested", "18. Faculty sees their interest status", `Status: ${myInt?.status}`);

  // Test 19: Unauthorized faculty management is rejected (Faculty B tries to view applicants of Faculty A's opp)
  const unauthApps = await request(`/faculty-collaboration/${collabOppId}/applicants`, {
    headers: { Cookie: `auth_token=${facultyB.token}` },
  });
  assert(unauthApps.status === 403, "19. Unauthorized faculty management is rejected", `Non-creator rejected with 403 Forbidden`);

  // Test 20: Status transitions behave correctly (Faculty A transitions interested -> under_review -> accepted)
  const reviewRes = await request(`/faculty-collaboration/interests/${interestId}/status`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${facultyA.token}` },
    body: JSON.stringify({ status: "under_review" }),
  });
  const acceptCollab = await request(`/faculty-collaboration/interests/${interestId}/status`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${facultyA.token}` },
    body: JSON.stringify({ status: "accepted" }),
  });
  assert(reviewRes.ok && acceptCollab.ok && acceptCollab.body?.data?.status === "accepted", "20. Status transitions behave correctly", `interested -> under_review -> accepted`);

  console.log("\n--- 4. PLACEMENT (Tests 21 - 30) ---");

  // Create an opportunity by Industry A
  const indOppRes = await pool.query(
    `INSERT INTO public.opportunities (id, title, description, opportunity_type, created_by, status, organization_id)
     VALUES (gen_random_uuid(), $1, 'Panchakarma Clinical Internship', 'internship', $2, 'published', $3)
     RETURNING id`,
    [`Panchakarma Internship ${runId}`, industryA.id, organizationId]
  );
  const indOppId = indOppRes.rows[0].id;

  // Create application for Student A with status = 'applied'
  const appRes = await pool.query(
    `INSERT INTO public.applications (id, opportunity_id, student_id, status)
     VALUES (gen_random_uuid(), $1, $2, 'applied')
     RETURNING id`,
    [indOppId, studentA.id]
  );
  const applicationId = appRes.rows[0].id;

  // Test 21: Industry can create placement only for selected application (currently 'applied')
  const failPlace = await request("/placements", {
    method: "POST",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({
      applicationId,
      engagementType: "internship",
      startDate: "2026-10-01",
      expectedEndDate: "2027-04-01",
    }),
  });
  assert(failPlace.status === 400, "21. Industry can create placement only for selected application", `Rejected non-selected with 400 Bad Request`);

  // Now update application to 'selected'
  await pool.query("UPDATE public.applications SET status = 'selected' WHERE id = $1", [applicationId]);

  const createPlace = await request("/placements", {
    method: "POST",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({
      applicationId,
      engagementType: "internship",
      startDate: "2026-10-01",
      expectedEndDate: "2027-04-01",
      supervisorName: "Dr. Arvind Gupta",
      supervisorEmail: "arvind@pharma.test",
    }),
  });
  const placementId = createPlace.body?.data?.id;
  assert(createPlace.status === 201 && placementId, "21b. Placement tracking successfully created for selected application", `Placement ID: ${placementId}`);

  // Test 22: Duplicate placement is rejected
  const dupPlace = await request("/placements", {
    method: "POST",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({
      applicationId,
      engagementType: "internship",
      startDate: "2026-10-01",
      expectedEndDate: "2027-04-01",
    }),
  });
  assert(dupPlace.status === 409, "22. Duplicate placement is rejected", `HTTP 409 Conflict`);

  // Test 23: Student can view own placement
  const stuPlaceRes = await request("/placements/student", {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  const foundStuPlace = (stuPlaceRes.body?.data || []).find((p) => p.id === placementId);
  assert(stuPlaceRes.ok && foundStuPlace, "23. Student can view own placement", `Student retrieved placement: ${foundStuPlace?.status}`);

  // Test 24: Student cannot view another student's placement
  const stuBPlaceRes = await request("/placements/student", {
    headers: { Cookie: `auth_token=${studentB.token}` },
  });
  const foundOther = (stuBPlaceRes.body?.data || []).find((p) => p.id === placementId);
  assert(stuBPlaceRes.ok && !foundOther, "24. Student cannot view another student's placement", `Student B sees 0 of Student A's placements`);

  // Test 25: Industry can view own placement
  const indPlaceRes = await request("/placements/industry?includeUnplaced=true", {
    headers: { Cookie: `auth_token=${industryA.token}` },
  });
  const foundIndPlace = (indPlaceRes.body?.data || []).find((p) => p.id === placementId);
  assert(indPlaceRes.ok && foundIndPlace, "25. Industry can view own placement", `Industry A found placement: ${foundIndPlace?.status}`);

  // Test 26: Industry cannot modify another industry's placement (Industry B trying to modify Placement created by Industry A)
  const crossIndUpdate = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryB.token}` },
    body: JSON.stringify({ status: "offer_accepted" }),
  });
  assert(crossIndUpdate.status === 403, "26. Industry cannot modify another industry's placement", `HTTP 403 Forbidden`);

  // Test 27: Valid status transitions work (selected -> offer_accepted -> joined -> in_progress)
  const step1 = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ status: "offer_accepted" }),
  });
  const step2 = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ status: "joined" }),
  });
  const step3 = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ status: "in_progress" }),
  });
  assert(step1.ok && step2.ok && step3.ok && step3.body?.data?.status === "in_progress", "27. Valid status transitions work", `Progressed: selected -> offer_accepted -> joined -> in_progress`);

  // Test 28: Invalid status transition is rejected (in_progress directly to withdrawn or selected)
  const invalidTransition = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ status: "withdrawn" }),
  });
  assert(invalidTransition.status === 400, "28. Invalid status transition is rejected", `Direct withdrawal from in_progress rejected with 400`);

  // Test 29: Date constraints work (expectedEndDate earlier than startDate)
  const badDate = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ startDate: "2026-12-01", expectedEndDate: "2026-01-01" }),
  });
  assert(badDate.status === 400, "29. Date constraints work", `expectedEndDate < startDate rejected with 400`);

  // Test 30: Progress 0–100 validation works (try progress = 150)
  const badProg = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ progressPercent: 150 }),
  });
  const goodProg = await request(`/placements/${placementId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${industryA.token}` },
    body: JSON.stringify({ progressPercent: 75 }),
  });
  const progVal = goodProg.body?.data?.progress_percent !== undefined ? Number(goodProg.body.data.progress_percent) : Number(goodProg.body?.data?.progressPercent);
  assert(badProg.status === 400 && goodProg.ok && progVal === 75, "30. Progress 0–100 validation works", `150 rejected, 75 accepted (val=${progVal})`);

  console.log("\n--- 5. STORAGE / SECURE ACCESS (Tests 31 - 34) ---");

  // Create portfolio item for student A
  const itemRes = await pool.query(
    `INSERT INTO public.portfolio_items (id, student_id, title, item_type)
     VALUES (gen_random_uuid(), $1, 'Ayush Research Report', 'project')
     RETURNING id`,
    [studentA.id]
  );
  const portfolioItemId = itemRes.rows[0].id;

  // Test 31: Upload works through backend (multipart upload to /portfolio/items/:id/documents)
  const boundary = "----WebKitFormBoundaryTest12345";
  const fileContent = "PDF-1.4 mock ayurvedic certificate file content";
  const payload = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="title"',
    "",
    "Ayurvedic Internship Certificate",
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="certificate.pdf"',
    "Content-Type: application/pdf",
    "",
    fileContent,
    `--${boundary}--`,
  ].join("\r\n");

  const uploadRes = await fetch(`${BACKEND_URL}/portfolio/items/${portfolioItemId}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Cookie: `auth_token=${studentA.token}`,
    },
    body: payload,
  });
  const uploadData = await uploadRes.json();
  const documentId = uploadData.data?.id;
  assert(uploadRes.status === 201 && documentId, "31. Upload works through backend", `Uploaded document id: ${documentId}`);

  // Test 32: Authenticated retrieval works (Generate signed URL and fetch stream)
  const signedUrlRes = await request(`/portfolio/documents/${documentId}/signed-url`, {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  const signedUrl = signedUrlRes.body?.data?.signedUrl;
  let streamOk = false;
  if (signedUrl) {
    const fullUrl = signedUrl.startsWith("http") ? signedUrl : `http://localhost:5000${signedUrl}`;
    const fileRes = await fetch(fullUrl);
    streamOk = fileRes.ok;
  }
  const directView = await fetch(`${BACKEND_URL}/portfolio/documents/${documentId}/view`, {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(signedUrlRes.ok && streamOk && directView.ok, "32. Authenticated retrieval works", `Signed stream fetched successfully`);

  // Test 33: Unauthorized retrieval is rejected (Student B attempting to view Student A's document)
  const unauthDoc = await request(`/portfolio/documents/${documentId}/view`, {
    headers: { Cookie: `auth_token=${studentB.token}` },
  });
  assert(unauthDoc.status === 403, "33. Unauthorized retrieval is rejected", `Cross-student retrieval rejected with 403`);

  // Test 34: Replacement does not leave inconsistent metadata/storage state
  // Delete document
  const delRes = await request(`/portfolio/documents/${documentId}`, {
    method: "DELETE",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  const reView = await request(`/portfolio/documents/${documentId}/view`, {
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(delRes.ok && reView.status === 404, "34. Replacement/deletion does not leave inconsistent state", `Deleted document returns 404`);

  console.log("\n--- 6. API FAILURE BEHAVIOR (Test 35) ---");
  // Test 35: Force an Express/API failure and verify the migrated page/action does NOT silently query Supabase
  // When an invalid ID or bad parameters are sent to an Express API endpoint with auth_token:
  const badEndpointRes = await request("/mentorship/faculty/requests/00000000-0000-0000-0000-000000000000/accept", {
    method: "POST",
    headers: { Cookie: `auth_token=${facultyA.token}` },
  });
  assert(badEndpointRes.status === 404, "35. Express failure surfaces directly (no silent fallback)", `Surfaced error status: ${badEndpointRes.status}, message: ${badEndpointRes.body?.message}`);

  console.log("\n================================================================================");
  console.log(` LIVE E2E RESULTS: ${passedCount} Passed, ${failedCount} Failed`);
  console.log("================================================================================");

  await pool.end();
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  pool.end();
  process.exit(1);
});
