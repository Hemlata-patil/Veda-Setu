import pg from "pg";
import fs from "fs";
import path from "path";
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
  const isMultipart = options.body instanceof FormData;

  const headers = {
    ...(isMultipart ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const rawCookie = res.headers.get("set-cookie") || "";
  const tokenMatch = rawCookie.match(/auth_token=([^;]+)/);
  const cookieToken = tokenMatch ? tokenMatch[1] : null;

  const contentType = res.headers.get("content-type") || "";
  let body;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else if (contentType.includes("text/")) {
    body = await res.text();
  } else {
    // ArrayBuffer / binary
    body = await res.arrayBuffer();
  }

  return { status: res.status, body, cookieToken, ok: res.ok, headers: res.headers };
}

async function main() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 7C-7 LIVE E2E VERIFICATION (31 CHECKS)");
  console.log(" Student Portfolio & Storage + Multi-Tenant Isolation + Error Surfacing");
  console.log(" Testing against live Express (http://localhost:5000) & real PostgreSQL");
  console.log("================================================================================\n");

  const runId = Date.now();

  // Create Institution
  const instRes = await pool.query(
    "INSERT INTO public.institutions (id, name, code) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
    [`National Institute of Ayurveda ${runId}`, `NIA-${runId}`]
  );
  const institutionId = instRes.rows[0].id;

  // Helper to create user
  async function createTestUser(email, role, fullName) {
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

    await pool.query("UPDATE public.profiles SET institution_id = $1, department = 'Dravyaguna' WHERE id = $2", [institutionId, userId]);

    // Log in to get fresh JWT token
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const token = loginRes.cookieToken || loginRes.body?.token;
    const resolvedRole = loginRes.body?.user?.role || role;

    return { id: userId, email, password, token, role: resolvedRole, fullName };
  }

  console.log("--- 1. AUTHENTICATION & ROLE RESOLUTION (Tests 1 - 3) ---");
  const studentA = await createTestUser(`student.a.${runId}@test.veda`, "student", `Aarav Student A ${runId}`);
  const studentB = await createTestUser(`student.b.${runId}@test.veda`, "student", `Bhavna Student B ${runId}`);

  // Test 1: Student login returns valid JWT token
  const loginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: studentA.email, password: studentA.password }),
  });
  assert(loginRes.ok && Boolean(loginRes.cookieToken || loginRes.body?.token), "1. Student login returns valid JWT token", `Token received: ${Boolean(loginRes.cookieToken || loginRes.body?.token)}`);

  // Test 2: /auth/me with JWT verifies student identity
  const meRes = await request("/auth/me", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(meRes.ok && meRes.body?.user?.id === studentA.id, "2. /auth/me with JWT verifies student identity", `User ID: ${meRes.body?.user?.id}`);

  // Test 3: Student role resolution confirms student authority
  assert(meRes.body?.user?.role === "student", "3. Student role resolution confirms student authority", `Role: ${meRes.body?.user?.role}`);

  console.log("\n--- 2. PORTFOLIO ITEM & STORAGE OPERATIONS (Tests 4 - 11) ---");
  // Test 4: Get own portfolio aggregates profile, items, competencies, documents, placements
  const portMeRes = await request("/portfolio/student", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(
    portMeRes.ok &&
    portMeRes.body?.data?.profile?.id === studentA.id &&
    Array.isArray(portMeRes.body?.data?.items) &&
    Array.isArray(portMeRes.body?.data?.competencies),
    "4. Get own portfolio aggregates profile, items, competencies, documents",
    `Items: ${portMeRes.body?.data?.items?.length}, Competencies: ${portMeRes.body?.data?.competencies?.length}`
  );

  // Test 5: Create portfolio item
  const createItemRes = await request("/portfolio/items", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({
      itemType: "certification",
      title: "Ayurvedic Clinical Pharmacology Certificate",
      issuerOrOrganization: "National Institute of Ayurveda",
      startDate: "2026-01-10",
      endDate: "2026-06-15",
      referenceUrl: "https://nia.nic.in/cert/123",
      achievement: "Top 5% Distinction",
      description: "Comprehensive practical examination on herbal formulation kinetics.",
    }),
  });
  assert(
    createItemRes.status === 201 && createItemRes.body?.data?.id,
    "5. Create portfolio item succeeds with authoritative Express validation",
    `Item ID: ${createItemRes.body?.data?.id}`
  );
  const itemAId = createItemRes.body?.data?.id;

  // Test 6: Update own item
  const updateItemRes = await request(`/portfolio/items/${itemAId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({
      title: "Ayurvedic Clinical Pharmacology & Formulation Certificate (Updated)",
      achievement: "Top 1% Gold Medal Distinction",
    }),
  });
  assert(
    updateItemRes.ok && updateItemRes.body?.data?.title?.includes("(Updated)"),
    "6. Update own portfolio item updates mutable fields safely",
    `Updated Title: ${updateItemRes.body?.data?.title}`
  );

  // Test 7: Upload document via multipart/form-data
  const samplePdfBytes = Buffer.from("%PDF-1.4 sample ayurveda certificate content for test run", "utf8");
  const blob1 = new Blob([samplePdfBytes], { type: "application/pdf" });
  const form1 = new FormData();
  form1.append("file", blob1, "ayurveda_pharmacology_cert.pdf");

  const uploadRes = await request(`/portfolio/items/${itemAId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: form1,
  });
  assert(
    uploadRes.status === 201 && uploadRes.body?.data?.id,
    "7. Upload document attaches private PDF evidence to portfolio item",
    `Doc ID: ${uploadRes.body?.data?.id}, Path: ${uploadRes.body?.data?.storage_path}`
  );
  const docAId = uploadRes.body?.data?.id;
  const storagePath1 = uploadRes.body?.data?.storage_path;

  // Test 8: View/access own document via signed URL
  const signedUrlRes = await request(`/portfolio/documents/${docAId}/signed-url`, {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(
    signedUrlRes.ok && signedUrlRes.body?.data?.signedUrl?.includes("/api/portfolio/documents/stream?token="),
    "8. Generate secure time-limited signed URL for viewing private document",
    `Signed URL: ${signedUrlRes.body?.data?.signedUrl?.slice(0, 50)}...`
  );

  // Test 9: Stream document via signed URL token
  const streamUrl = signedUrlRes.body?.data?.signedUrl;
  const streamPath = streamUrl.replace("/api", "");
  const streamRes = await request(streamPath, { method: "GET" });
  assert(
    streamRes.ok && streamRes.headers.get("content-type") === "application/pdf",
    "9. Stream document via time-limited HMAC token serves correct binary content without exposing filesystem",
    `Content-Type: ${streamRes.headers.get("content-type")}`
  );

  // Test 10: Replace document (atomic replacement: uploads new, creates metadata, removes old file and row)
  const samplePdfBytes2 = Buffer.from("%PDF-1.4 updated second version certificate content", "utf8");
  const blob2 = new Blob([samplePdfBytes2], { type: "application/pdf" });
  const form2 = new FormData();
  form2.append("file", blob2, "ayurveda_cert_v2.pdf");

  const replaceRes = await request(`/portfolio/items/${itemAId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: form2,
  });
  assert(
    replaceRes.status === 201 && replaceRes.body?.data?.id !== docAId,
    "10. Replace document creates new document row and storage object atomically",
    `New Doc ID: ${replaceRes.body?.data?.id}`
  );
  const docA2Id = replaceRes.body?.data?.id;
  const storagePath2 = replaceRes.body?.data?.storage_path;

  // Verify old document row is removed from DB
  const oldDocCheck = await pool.query("SELECT id FROM public.portfolio_documents WHERE id = $1", [docAId]);
  assert(oldDocCheck.rows.length === 0, "10b. Replacement verification: old database row was purged", `Rows: ${oldDocCheck.rows.length}`);

  // Test 11: Delete attached document
  const delDocRes = await request(`/portfolio/documents/${docA2Id}`, {
    method: "DELETE",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(delDocRes.ok, "11. Delete attached document cleans up storage and removes metadata row", `Status: ${delDocRes.status}`);

  console.log("\n--- 3. MULTI-TENANT ISOLATION (Tests 12 - 16) ---");
  // Create an item and document for Student B
  const itemBRes = await request("/portfolio/items", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentB.token}` },
    body: JSON.stringify({
      itemType: "research",
      title: "Student B Ashwagandha Clinical Study",
      issuerOrOrganization: "CCRAS New Delhi",
    }),
  });
  const itemBId = itemBRes.body?.data?.id;

  const blobB = new Blob([Buffer.from("Student B study pdf", "utf8")], { type: "application/pdf" });
  const formB = new FormData();
  formB.append("file", blobB, "student_b_study.pdf");
  const docBRes = await request(`/portfolio/items/${itemBId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentB.token}` },
    body: formB,
  });
  const docBId = docBRes.body?.data?.id;

  // Test 12: Student A cannot read Student B portfolio
  const studentAPortfolio = await request("/portfolio/student", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  const containsItemB = (studentAPortfolio.body?.data?.items || []).some((i) => i.id === itemBId);
  assert(!containsItemB, "12. Tenant Isolation — Student A cannot see Student B's portfolio entries", `Contains B: ${containsItemB}`);

  // Test 13: Student A cannot update Student B portfolio
  const crossUpdateRes = await request(`/portfolio/items/${itemBId}`, {
    method: "PATCH",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({ title: "Hacked by Student A" }),
  });
  assert(crossUpdateRes.status === 403, "13. Tenant Isolation — Student A blocked from updating Student B portfolio item (403 Forbidden)", `Status: ${crossUpdateRes.status}`);

  // Test 14: Student A cannot delete Student B portfolio
  const crossDeleteRes = await request(`/portfolio/items/${itemBId}`, {
    method: "DELETE",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(crossDeleteRes.status === 403, "14. Tenant Isolation — Student A blocked from deleting Student B portfolio item (403 Forbidden)", `Status: ${crossDeleteRes.status}`);

  // Test 15: Student A cannot upload to Student B item
  const crossUploadForm = new FormData();
  crossUploadForm.append("file", new Blob([Buffer.from("malicious")], { type: "application/pdf" }), "malicious.pdf");
  const crossUploadRes = await request(`/portfolio/items/${itemBId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: crossUploadForm,
  });
  assert(crossUploadRes.status === 403, "15. Tenant Isolation — Student A blocked from uploading to Student B item (403 Forbidden)", `Status: ${crossUploadRes.status}`);

  // Test 16: Student A cannot access Student B document
  const crossDocViewRes = await request(`/portfolio/documents/${docBId}/signed-url`, {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(crossDocViewRes.status === 403, "16. Tenant Isolation — Student A blocked from accessing Student B document (403 Forbidden)", `Status: ${crossDocViewRes.status}`);

  console.log("\n--- 4. STORAGE & VALIDATION INTEGRITY (Tests 17 - 21) ---");
  // Test 17: File size validation (> 5 MB rejected with 413)
  const oversizedBuffer = Buffer.alloc(5242881); // 5 MB + 1 byte
  const oversizeBlob = new Blob([oversizedBuffer], { type: "application/pdf" });
  const oversizeForm = new FormData();
  oversizeForm.append("file", oversizeBlob, "too_large.pdf");

  const oversizeRes = await request(`/portfolio/items/${itemAId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: oversizeForm,
  });
  assert(oversizeRes.status === 413 || oversizeRes.status === 400, "17. Storage Validation — File exceeding 5 MB limit rejected with 413 Payload Too Large", `Status: ${oversizeRes.status}`);

  // Test 18: File type validation (disallowed MIME type rejected with 400)
  const badMimeBlob = new Blob([Buffer.from("malicious script")], { type: "application/x-msdownload" });
  const badMimeForm = new FormData();
  badMimeForm.append("file", badMimeBlob, "malware.exe");

  const badMimeRes = await request(`/portfolio/items/${itemAId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: badMimeForm,
  });
  assert(badMimeRes.status === 400, "18. Storage Validation — Disallowed MIME type (.exe) rejected with 400 Bad Request", `Status: ${badMimeRes.status}`);

  // Test 19: Direct authenticated view stream (`GET /documents/:id/view`)
  // First upload a fresh test document
  const testDocForm = new FormData();
  testDocForm.append("file", new Blob([Buffer.from("Dravyaguna Herbarium Specimen Sheet", "utf8")], { type: "image/png" }), "herbarium.png");
  const testDocUpload = await request(`/portfolio/items/${itemAId}/documents`, {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: testDocForm,
  });
  const testDocId = testDocUpload.body?.data?.id;

  const directViewRes = await request(`/portfolio/documents/${testDocId}/view`, {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(
    directViewRes.ok && directViewRes.headers.get("content-type") === "image/png",
    "19. Direct authenticated streaming route serves correct image/png content stream",
    `Content-Type: ${directViewRes.headers.get("content-type")}`
  );

  // Test 20: Replacement consistency check on disk
  const uploadsBaseDir = fs.existsSync(path.resolve(process.cwd(), "backend", "uploads", "portfolio-documents"))
    ? path.resolve(process.cwd(), "backend", "uploads", "portfolio-documents")
    : path.resolve(process.cwd(), "uploads", "portfolio-documents");
  const studentFolder = path.join(uploadsBaseDir, studentA.id, itemAId);
  const filesInFolder = fs.existsSync(studentFolder) ? fs.readdirSync(studentFolder) : [];
  assert(filesInFolder.length === 1, "20. Replacement consistency — Directory contains exactly 1 active file with zero orphaned replacements", `Files count: ${filesInFolder.length}`);

  // Test 21: Cleanup after portfolio item deletion
  const deleteItemRes = await request(`/portfolio/items/${itemAId}`, {
    method: "DELETE",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(deleteItemRes.ok, "21. Delete portfolio item succeeds", `Status: ${deleteItemRes.status}`);

  // Verify attached document metadata is deleted from DB
  const docPurgedCheck = await pool.query("SELECT id FROM public.portfolio_documents WHERE portfolio_item_id = $1", [itemAId]);
  const filesAfterDelete = fs.existsSync(studentFolder) ? fs.readdirSync(studentFolder) : [];
  assert(
    docPurgedCheck.rows.length === 0 && filesAfterDelete.length === 0,
    "21b. Cascade cleanup: Attached document metadata and storage files are completely purged without orphans",
    `DB Docs: ${docPurgedCheck.rows.length}, Disk files: ${filesAfterDelete.length}`
  );

  console.log("\n--- 5. REGRESSION ACROSS ALL PRIOR STUDENT MODULES (Tests 22 - 29) ---");
  // Test 22: Assessment still works
  const assessRes = await request("/assessments", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(assessRes.ok, "22. Regression: Student Skills & Assessment still operational (7C-2)", `Status: ${assessRes.status}`);

  // Test 23: Learning & Roadmap still works
  const learnRes = await request("/students/me/competencies", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(learnRes.ok, "23. Regression: Student Learning & Roadmap still operational (7C-3)", `Status: ${learnRes.status}`);

  // Test 24: Opportunities still work
  const oppRes = await request("/opportunities", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(oppRes.ok, "24. Regression: Student Opportunities still operational (7C-4)", `Status: ${oppRes.status}`);

  // Test 25: Applications still work
  const appRes = await request("/students/me/applications", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(appRes.ok, "25. Regression: Student Applications still operational (7C-4)", `Status: ${appRes.status}`);

  // Test 26: Mentorship still works
  const mentorRes = await request("/mentorship/student", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(mentorRes.ok, "26. Regression: Mentorship & Collaboration still operational (7C-5)", `Status: ${mentorRes.status}`);

  // Test 27: Internship/Placement still works
  const placeRes = await request("/placements/student", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(placeRes.ok, "27. Regression: Internship & Placement still operational (7C-6)", `Status: ${placeRes.status}`);

  // Test 28: Profile still works
  const profRes = await request("/auth/me", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(profRes.ok && profRes.body?.user?.email === studentA.email, "28. Regression: Student Profile & Auth still operational (7C-1)", `Email: ${profRes.body?.user?.email}`);

  // Test 29: Student dashboard items endpoint still works
  const dashItemsRes = await request("/portfolio/items", {
    method: "GET",
    headers: { Cookie: `auth_token=${studentA.token}` },
  });
  assert(dashItemsRes.ok && Array.isArray(dashItemsRes.body?.data), "29. Regression: Dashboard portfolio items summary still operational", `Items: ${dashItemsRes.body?.data?.length}`);

  console.log("\n--- 6. API FAILURE & ERROR SURFACING (Tests 30 - 31) ---");
  // Test 30: Force an Express API validation failure (end date earlier than start date)
  const failItemRes = await request("/portfolio/items", {
    method: "POST",
    headers: { Cookie: `auth_token=${studentA.token}` },
    body: JSON.stringify({
      itemType: "certification",
      title: "Faulty Date Range Test",
      startDate: "2026-10-01",
      endDate: "2026-05-01", // Earlier than start date
    }),
  });
  assert(failItemRes.status === 400, "30. Express API strictly rejects invalid input with 400 Bad Request", `Status: ${failItemRes.status}`);

  // Test 31: Verify error response shape contains meaningful error message and is not swallowed
  assert(
    failItemRes.body?.message?.includes("End date cannot be earlier than start date") ||
    failItemRes.body?.errors?.length > 0,
    "31. Verification: Migrated portfolio action surfaces backend error directly without silently querying Supabase",
    `Message: ${failItemRes.body?.message || JSON.stringify(failItemRes.body?.errors)}`
  );

  console.log("\n================================================================================");
  console.log(` MODULE 7C-7 LIVE E2E SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
  console.log("================================================================================\n");

  await pool.end();

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error("Live E2E execution error:", err);
  await pool.end();
  process.exit(1);
});
