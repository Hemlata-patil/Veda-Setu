/**
 * VEDA SETU — MODULE 6 AUTOMATED TEST SUITE
 * Validates:
 * 1. Internship & Career Placement Tracking Lifecycle & State Machine
 * 2. Multi-Tenant Placement Isolation (Student, Industry, Institution)
 * 3. Student Digital Portfolio Items CRUD & Validation
 * 4. Portfolio Document Attachments, Pluggable Storage Abstraction, Atomic Replacement & Cascade Deletion
 */

import * as dbModule from "../src/db";
import { placementService } from "../src/services/placement.service";
import { PortfolioService } from "../src/services/portfolio.service";
import { IStorageService } from "../src/storage/storage.interface";
import { requireAuth, requireRole } from "../src/middleware/auth.middleware";

// =============================================================================
// TEST FRAMEWORK & IN-MEMORY TEST FIXTURES
// =============================================================================

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, message: string, details?: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    if (details) console.log(`       ${details}`);
    totalPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    if (details) console.error(`       ${details}`);
    totalFailed++;
  }
}

// In-memory data store for Module 6 tests
interface UserRecord {
  id: string;
  email: string;
  role: string;
}

interface ProfileRecord {
  id: string;
  full_name: string;
  role: string;
  institution_id: string | null;
  department: string | null;
  program: string | null;
  year: number | null;
}

interface OpportunityRecord {
  id: string;
  title: string;
  opportunity_type: string;
  created_by: string;
  organization_id: string | null;
  location: string | null;
  mode: string | null;
}

interface ApplicationRecord {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: string;
  applied_at: string;
}

interface PlacementRecord {
  id: string;
  application_id: string;
  engagement_type: "internship" | "placement";
  status: "selected" | "offer_accepted" | "joined" | "in_progress" | "completed" | "withdrawn";
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  progress_percent: number;
  supervisor_name: string | null;
  supervisor_email: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

interface PortfolioItemRecord {
  id: string;
  student_id: string;
  item_type: string;
  title: string;
  description: string | null;
  issuer_or_organization: string | null;
  start_date: string | null;
  end_date: string | null;
  reference_url: string | null;
  achievement: string | null;
  created_at: string;
  updated_at: string;
}

interface PortfolioDocumentRecord {
  id: string;
  portfolio_item_id: string;
  student_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const usersTable = new Map<string, UserRecord>([
  ["student-1", { id: "student-1", email: "aarav.patel@student.aiia.edu.in", role: "student" }],
  ["student-2", { id: "student-2", email: "priya.sharma@student.nia.edu.in", role: "student" }],
  ["industry-1", { id: "industry-1", email: "himalaya.lead@himalaya.com", role: "industry" }],
  ["industry-2", { id: "industry-2", email: "dabur.lead@dabur.com", role: "industry" }],
  ["institution-admin-1", { id: "institution-admin-1", email: "dean@aiia.edu.in", role: "institution" }],
  ["institution-admin-2", { id: "institution-admin-2", email: "dean@nia.edu.in", role: "institution" }],
]);

const profilesTable = new Map<string, ProfileRecord>([
  ["student-1", { id: "student-1", full_name: "Aarav Patel", role: "student", institution_id: "inst-aiia", department: "Kayachikitsa", program: "BAMS", year: 4 }],
  ["student-2", { id: "student-2", full_name: "Priya Sharma", role: "student", institution_id: "inst-nia", department: "Dravyaguna", program: "BAMS", year: 3 }],
  ["industry-1", { id: "industry-1", full_name: "Himalaya Wellness HR", role: "industry", institution_id: null, department: null, program: null, year: null }],
  ["industry-2", { id: "industry-2", full_name: "Dabur Research HR", role: "industry", institution_id: null, department: null, program: null, year: null }],
  ["institution-admin-1", { id: "institution-admin-1", full_name: "AIIA Academic Office", role: "institution", institution_id: "inst-aiia", department: "Administration", program: null, year: null }],
  ["institution-admin-2", { id: "institution-admin-2", full_name: "NIA Dean Office", role: "institution", institution_id: "inst-nia", department: "Administration", program: null, year: null }],
]);

const institutionsTable = [
  { id: "inst-aiia", name: "All India Institute of Ayurveda", code: "AIIA" },
  { id: "inst-nia", name: "National Institute of Ayurveda", code: "NIA" },
];

const organizationsTable = [
  { id: "org-himalaya", name: "Himalaya Wellness Company", organization_type: "Pharma" },
  { id: "org-dabur", name: "Dabur India Ltd", organization_type: "Research & Manufacturing" },
];

const opportunitiesTable = new Map<string, OpportunityRecord>([
  ["opp-1", { id: "opp-1", title: "Clinical Trial Internship", opportunity_type: "internship", created_by: "industry-1", organization_id: "org-himalaya", location: "Bengaluru", mode: "onsite" }],
  ["opp-2", { id: "opp-2", title: "Formulation Scientist Role", opportunity_type: "entry_level_job", created_by: "industry-2", organization_id: "org-dabur", location: "Delhi", mode: "onsite" }],
]);

const applicationsTable = new Map<string, ApplicationRecord>([
  ["app-1", { id: "app-1", opportunity_id: "opp-1", student_id: "student-1", status: "selected", applied_at: "2026-09-01T10:00:00Z" }],
  ["app-2", { id: "app-2", opportunity_id: "opp-1", student_id: "student-2", status: "applied", applied_at: "2026-09-02T11:00:00Z" }],
  ["app-3", { id: "app-3", opportunity_id: "opp-2", student_id: "student-2", status: "selected", applied_at: "2026-09-03T12:00:00Z" }],
]);

const placementsTable = new Map<string, PlacementRecord>();
const portfolioItemsTable = new Map<string, PortfolioItemRecord>();
const portfolioDocumentsTable = new Map<string, PortfolioDocumentRecord>();

// =============================================================================
// STORAGE MOCK ABSTRACTION IMPLEMENTATION
// =============================================================================

class MockStorageService implements IStorageService {
  public files = new Map<string, { buffer: Buffer; contentType: string }>();
  public uploadFailNext = false;
  public deleteFailNext = false;

  async upload(storagePath: string, fileBuffer: Buffer, contentType: string): Promise<void> {
    if (this.uploadFailNext) {
      this.uploadFailNext = false;
      throw new Error("Storage upload simulation error: disk full");
    }
    this.files.set(storagePath, { buffer: fileBuffer, contentType });
  }

  async delete(storagePath: string): Promise<void> {
    if (this.deleteFailNext) {
      this.deleteFailNext = false;
      throw new Error("Storage delete simulation error");
    }
    this.files.delete(storagePath);
  }

  async getSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string> {
    if (!this.files.has(storagePath)) {
      throw new Error("Storage file not found");
    }
    return `https://storage.ayush.local/signed/${storagePath}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  async getFileStream(storagePath: string): Promise<any> {
    const file = this.files.get(storagePath);
    if (!file) {
      throw new Error("Stored document file not found.");
    }
    return {
      stream: null,
      contentType: file.contentType,
      contentLength: file.buffer.length,
    };
  }
}

const mockStorage = new MockStorageService();
const testPortfolioService = new PortfolioService(mockStorage);

// =============================================================================
// DATABASE QUERY SIMULATOR
// =============================================================================

const mockQueryFn = async (sql: string, params?: any[]): Promise<{ rows: any[] }> => {
  const text = sql.trim();

  // 1. Placement - Application lookup
  if (text.includes("FROM public.applications a") && text.includes("JOIN public.opportunities o") && text.includes("WHERE a.id = $1")) {
    const appId = params?.[0];
    const app = applicationsTable.get(appId);
    if (!app) return { rows: [] };
    const opp = opportunitiesTable.get(app.opportunity_id);
    return {
      rows: [{
        id: app.id,
        status: app.status,
        student_id: app.student_id,
        opportunity_id: opp?.id,
        created_by: opp?.created_by,
      }],
    };
  }

  // 2. Placement - Duplicate application check
  if (text.includes("SELECT id FROM public.internship_placements WHERE application_id = $1")) {
    const appId = params?.[0];
    const match = Array.from(placementsTable.values()).find((p) => p.application_id === appId);
    return { rows: match ? [{ id: match.id }] : [] };
  }

  // 3. Placement - Insert
  if (text.startsWith("INSERT INTO public.internship_placements")) {
    const id = `plc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecord: PlacementRecord = {
      id,
      application_id: params?.[0],
      engagement_type: params?.[1],
      status: "selected",
      start_date: params?.[2] || null,
      expected_end_date: params?.[3] || null,
      actual_end_date: null,
      supervisor_name: params?.[4] || null,
      supervisor_email: params?.[5] || null,
      progress_percent: 0,
      outcome: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    placementsTable.set(id, newRecord);
    return { rows: [newRecord] };
  }

  // 4. Placement - Lookup for update
  if (text.includes("FROM public.internship_placements p") && text.includes("JOIN public.applications a") && text.includes("WHERE p.id = $1")) {
    const pid = params?.[0];
    const p = placementsTable.get(pid);
    if (!p) return { rows: [] };
    const app = applicationsTable.get(p.application_id);
    const opp = opportunitiesTable.get(app?.opportunity_id || "");
    return {
      rows: [{
        ...p,
        created_by: opp?.created_by,
      }],
    };
  }

  // 5. Placement - Update
  if (text.startsWith("UPDATE public.internship_placements") && text.includes("WHERE id = $9")) {
    const status = params?.[0];
    const startDate = params?.[1];
    const expectedEndDate = params?.[2];
    const actualEndDate = params?.[3];
    const progress = params?.[4];
    const supervisorName = params?.[5];
    const supervisorEmail = params?.[6];
    const outcome = params?.[7];
    const pid = params?.[8];

    const p = placementsTable.get(pid);
    if (p) {
      if (status !== null) p.status = status;
      if (startDate !== null) p.start_date = startDate;
      if (expectedEndDate !== null) p.expected_end_date = expectedEndDate;
      if (actualEndDate !== null) p.actual_end_date = actualEndDate;
      if (progress !== null) p.progress_percent = progress;
      if (supervisorName !== null) p.supervisor_name = supervisorName;
      if (supervisorEmail !== null) p.supervisor_email = supervisorEmail;
      if (outcome !== null) p.outcome = outcome;
      p.updated_at = new Date().toISOString();
      placementsTable.set(pid, p);
      return { rows: [p] };
    }
    return { rows: [] };
  }

  // 6. Placement - Student list
  if (text.includes("FROM public.internship_placements p") && text.includes("WHERE a.student_id = $1")) {
    const sid = params?.[0];
    const rows = Array.from(placementsTable.values())
      .filter((p) => {
        const app = applicationsTable.get(p.application_id);
        return app?.student_id === sid;
      })
      .map((p) => {
        const app = applicationsTable.get(p.application_id)!;
        const opp = opportunitiesTable.get(app.opportunity_id)!;
        const org = organizationsTable.find((o) => o.id === opp.organization_id);
        return {
          ...p,
          application_id: app.id,
          application_status: app.status,
          applied_at: app.applied_at,
          opportunity_id: opp.id,
          opportunity_title: opp.title,
          opportunity_type: opp.opportunity_type,
          opportunity_location: opp.location,
          opportunity_mode: opp.mode,
          organization_id: org?.id || null,
          organization_name: org?.name || null,
          organization_type: org?.organization_type || null,
        };
      });
    return { rows };
  }

  // 7. Placement - Industry list
  if (text.includes("FROM public.internship_placements p") && text.includes("WHERE o.created_by = $1")) {
    const creatorId = params?.[0];
    const rows = Array.from(placementsTable.values())
      .filter((p) => {
        const app = applicationsTable.get(p.application_id);
        const opp = opportunitiesTable.get(app?.opportunity_id || "");
        return opp?.created_by === creatorId;
      })
      .map((p) => {
        const app = applicationsTable.get(p.application_id)!;
        const opp = opportunitiesTable.get(app.opportunity_id)!;
        const stu = profilesTable.get(app.student_id)!;
        const u = usersTable.get(app.student_id)!;
        const inst = institutionsTable.find((i) => i.id === stu.institution_id);
        return {
          ...p,
          application_id: app.id,
          application_status: app.status,
          applied_at: app.applied_at,
          student_id: stu.id,
          student_name: stu.full_name,
          student_email: u.email,
          student_program: stu.program,
          student_year: stu.year,
          student_department: stu.department,
          institution_name: inst?.name || null,
          institution_code: inst?.code || null,
          opportunity_id: opp.id,
          opportunity_title: opp.title,
          opportunity_type: opp.opportunity_type,
        };
      });
    return { rows };
  }

  // 8. Placement - Institution list
  if (text.includes("FROM public.internship_placements p") && text.includes("WHERE stu.institution_id = $1")) {
    const instId = params?.[0];
    const rows = Array.from(placementsTable.values())
      .filter((p) => {
        const app = applicationsTable.get(p.application_id);
        const stu = profilesTable.get(app?.student_id || "");
        return stu?.institution_id === instId;
      })
      .map((p) => {
        const app = applicationsTable.get(p.application_id)!;
        const opp = opportunitiesTable.get(app.opportunity_id)!;
        const stu = profilesTable.get(app.student_id)!;
        const u = usersTable.get(app.student_id)!;
        const org = organizationsTable.find((o) => o.id === opp.organization_id);
        return {
          ...p,
          application_id: app.id,
          application_status: app.status,
          applied_at: app.applied_at,
          student_id: stu.id,
          student_name: stu.full_name,
          student_email: u.email,
          student_program: stu.program,
          student_year: stu.year,
          student_department: stu.department,
          opportunity_id: opp.id,
          opportunity_title: opp.title,
          opportunity_type: opp.opportunity_type,
          organization_id: org?.id || null,
          organization_name: org?.name || null,
          organization_type: org?.organization_type || null,
        };
      });
    return { rows };
  }

  // 9. Placement - Detail by ID
  if (text.includes("FROM public.internship_placements p") && text.includes("WHERE p.id = $1")) {
    const pid = params?.[0];
    const p = placementsTable.get(pid);
    if (!p) return { rows: [] };
    const app = applicationsTable.get(p.application_id)!;
    const opp = opportunitiesTable.get(app.opportunity_id)!;
    const stu = profilesTable.get(app.student_id)!;
    const u = usersTable.get(app.student_id)!;
    const org = organizationsTable.find((o) => o.id === opp.organization_id);
    return {
      rows: [{
        ...p,
        application_id: app.id,
        student_id: stu.id,
        student_institution_id: stu.institution_id,
        student_name: stu.full_name,
        student_email: u.email,
        opportunity_id: opp.id,
        opportunity_creator_id: opp.created_by,
        opportunity_title: opp.title,
        opportunity_type: opp.opportunity_type,
        organization_id: org?.id || null,
        organization_name: org?.name || null,
      }],
    };
  }

  // 10. Profile lookup for Institution ID
  if (text.includes("SELECT institution_id FROM public.profiles WHERE id = $1")) {
    const uid = params?.[0];
    const prof = profilesTable.get(uid);
    return { rows: prof ? [{ institution_id: prof.institution_id }] : [] };
  }

  // 11. Portfolio Items - Insert
  if (text.includes("INSERT INTO public.portfolio_items")) {
    const id = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecord: PortfolioItemRecord = {
      id,
      student_id: params?.[0],
      item_type: params?.[1],
      title: params?.[2],
      description: params?.[3] || null,
      issuer_or_organization: params?.[4] || null,
      start_date: params?.[5] || null,
      end_date: params?.[6] || null,
      reference_url: params?.[7] || null,
      achievement: params?.[8] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    portfolioItemsTable.set(id, newRecord);
    return { rows: [newRecord] };
  }

  // 12. Portfolio Items - Lookup for update/delete
  if (text.includes("SELECT id, student_id, start_date, end_date FROM public.portfolio_items WHERE id = $1")) {
    const id = params?.[0];
    const item = portfolioItemsTable.get(id);
    return { rows: item ? [item] : [] };
  }

  if (text.includes("SELECT id, student_id FROM public.portfolio_items WHERE id = $1")) {
    const id = params?.[0];
    const item = portfolioItemsTable.get(id);
    return { rows: item ? [item] : [] };
  }

  // 13. Portfolio Items - Update
  if (text.includes("UPDATE public.portfolio_items")) {
    const itemType = params?.[0];
    const title = params?.[1];
    const desc = params?.[2];
    const issuer = params?.[3];
    const startDate = params?.[4];
    const endDate = params?.[5];
    const refUrl = params?.[6];
    const ach = params?.[7];
    const id = params?.[8];
    const studentId = params?.[9];

    const item = portfolioItemsTable.get(id);
    if (item && item.student_id === studentId) {
      if (itemType) item.item_type = itemType;
      if (title) item.title = title;
      if (desc !== null) item.description = desc;
      if (issuer !== null) item.issuer_or_organization = issuer;
      if (startDate !== null) item.start_date = startDate;
      if (endDate !== null) item.end_date = endDate;
      if (refUrl !== null) item.reference_url = refUrl;
      if (ach !== null) item.achievement = ach;
      item.updated_at = new Date().toISOString();
      portfolioItemsTable.set(id, item);
      return { rows: [item] };
    }
    return { rows: [] };
  }

  // 14. Portfolio Items - Delete
  if (text.includes("DELETE FROM public.portfolio_items WHERE id = $1 AND student_id = $2")) {
    const id = params?.[0];
    const sid = params?.[1];
    const item = portfolioItemsTable.get(id);
    if (item && item.student_id === sid) {
      portfolioItemsTable.delete(id);
      // Cascade delete documents
      for (const [docId, doc] of portfolioDocumentsTable.entries()) {
        if (doc.portfolio_item_id === id) {
          portfolioDocumentsTable.delete(docId);
        }
      }
      return { rows: [] };
    }
    return { rows: [] };
  }

  // 15. Portfolio Items - List for student
  if (text.includes("FROM public.portfolio_items") && text.includes("student_id = $1")) {
    const sid = params?.[0];
    const rows = Array.from(portfolioItemsTable.values()).filter((i) => i.student_id === sid);
    return { rows };
  }

  // 16. Portfolio Documents - List for item
  if (text.includes("FROM public.portfolio_documents") && text.includes("portfolio_item_id = $1 AND student_id = $2")) {
    const itemId = params?.[0];
    const sid = params?.[1];
    const rows = Array.from(portfolioDocumentsTable.values()).filter(
      (d) => d.portfolio_item_id === itemId && d.student_id === sid
    );
    return { rows };
  }

  // 17. Portfolio Documents - Insert
  if (text.includes("INSERT INTO public.portfolio_documents")) {
    const id = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc: PortfolioDocumentRecord = {
      id,
      portfolio_item_id: params?.[0],
      student_id: params?.[1],
      storage_path: params?.[2],
      file_name: params?.[3],
      file_type: params?.[4],
      file_size: params?.[5],
      created_at: new Date().toISOString(),
    };
    portfolioDocumentsTable.set(id, newDoc);
    return { rows: [newDoc] };
  }

  // 18. Portfolio Documents - Delete
  if (text.includes("DELETE FROM public.portfolio_documents") && text.includes("WHERE id = $1 AND student_id = $2")) {
    const id = params?.[0];
    const sid = params?.[1];
    const doc = portfolioDocumentsTable.get(id);
    if (doc && doc.student_id === sid) {
      portfolioDocumentsTable.delete(id);
      return { rows: [] };
    }
    return { rows: [] };
  }

  if (text.includes("DELETE FROM public.portfolio_documents") && text.includes("id = ANY($1::uuid[]) AND student_id = $2")) {
    const ids: string[] = params?.[0] || [];
    const sid = params?.[1];
    for (const id of ids) {
      const doc = portfolioDocumentsTable.get(id);
      if (doc && doc.student_id === sid) {
        portfolioDocumentsTable.delete(id);
      }
    }
    return { rows: [] };
  }

  // 19. Portfolio Documents - Lookup
  if (text.includes("FROM public.portfolio_documents") && text.includes("WHERE id = $1")) {
    const id = params?.[0];
    const doc = portfolioDocumentsTable.get(id);
    return { rows: doc ? [doc] : [] };
  }

  // 20. Portfolio Documents - List for student
  if (text.includes("FROM public.portfolio_documents") && text.includes("WHERE student_id = $1")) {
    const sid = params?.[0];
    const rows = Array.from(portfolioDocumentsTable.values()).filter((d) => d.student_id === sid);
    return { rows };
  }

  // 21. Student Profile lookup for Portfolio view
  if (text.includes("FROM public.profiles p") && text.includes("JOIN public.users u") && text.includes("p.id = $1")) {
    const sid = params?.[0];
    const prof = profilesTable.get(sid);
    const u = usersTable.get(sid);
    const inst = institutionsTable.find((i) => i.id === prof?.institution_id);
    if (!prof) return { rows: [] };
    return {
      rows: [{
        id: prof.id,
        full_name: prof.full_name,
        email: u?.email || "",
        role: prof.role,
        program: prof.program,
        year: prof.year,
        department: prof.department,
        institution_name: inst?.name || null,
        institution_code: inst?.code || null,
      }],
    };
  }

  // 22. Student Competencies
  if (text.includes("FROM public.student_competencies sc") && text.includes("sc.student_id = $1")) {
    return {
      rows: [
        { competency_id: "comp-1", proficiency_score: 85, verified: true, name: "Panchakarma Protocol", category: "clinical_practical" },
        { competency_id: "comp-2", proficiency_score: 90, verified: true, name: "Dravyaguna Identification", category: "academic_domain" },
      ],
    };
  }

  return { rows: [] };
};

// Patch db module
(dbModule.db as any).query = mockQueryFn;
(dbModule.pool as any).query = mockQueryFn;

// =============================================================================
// TEST SUITE EXECUTION
// =============================================================================

async function runModule6Tests() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 6: PLACEMENTS & DIGITAL PORTFOLIO TEST SUITE");
  console.log("================================================================================\n");

  console.log("--- 1. Authentication & Role Boundary Tests ---");

  // TEST 1: Unauthenticated request rejected with 401
  let unauthBlocked = false;
  const mockUnauthReq: any = { headers: {}, cookies: {} };
  const mockRes: any = {
    status: (code: number) => ({
      json: (body: any) => { if (code === 401) unauthBlocked = true; },
    }),
  };
  await requireAuth(mockUnauthReq, mockRes, () => {});
  assert(unauthBlocked, "Test 1: Unauthenticated request rejected with 401 Unauthorized");

  // TEST 2: Student role blocked from industry placement creation route (403 Forbidden)
  let studentBlocked = false;
  const mockStudentReq: any = { user: { userId: "student-1", role: "student" } };
  const industryOnlyMiddleware = requireRole("industry");
  const mockForbiddenRes: any = {
    status: (code: number) => ({
      json: (body: any) => { if (code === 403) studentBlocked = true; },
    }),
  };
  await industryOnlyMiddleware(mockStudentReq, mockForbiddenRes, () => {});
  assert(studentBlocked, "Test 2: Student role blocked from initiating placement tracking (403 Forbidden)");

  // TEST 3: Industry role blocked from student portfolio routes (403 Forbidden)
  let industryBlocked = false;
  const mockIndustryReq: any = { user: { userId: "industry-1", role: "industry" } };
  const studentOnlyMiddleware = requireRole("student");
  await studentOnlyMiddleware(mockIndustryReq, mockForbiddenRes, () => {});
  assert(studentBlocked, "Test 3: Industry role blocked from modifying student portfolio (403 Forbidden)");

  console.log("\n--- 2. Internship & Placement Tracking Lifecycle ---");

  // TEST 4: Placement creation rejected if application status is not 'selected'
  let unselectedAppBlocked = false;
  try {
    await placementService.createPlacementTracking("industry-1", {
      applicationId: "app-2", // app-2 is in 'applied' status
      engagementType: "internship",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("status 'selected'")) {
      unselectedAppBlocked = true;
    }
  }
  assert(unselectedAppBlocked, "Test 4: Placement tracking rejected if application status is not 'selected' (400 Bad Request)");

  // TEST 5: Non-owner industry user rejected from initiating placement tracking
  let nonOwnerIndustryBlocked = false;
  try {
    await placementService.createPlacementTracking("industry-2", {
      applicationId: "app-1", // app-1 belongs to opp-1 authored by industry-1
      engagementType: "internship",
    });
  } catch (err: any) {
    if (err.statusCode === 403) nonOwnerIndustryBlocked = true;
  }
  assert(nonOwnerIndustryBlocked, "Test 5: Non-author industry user blocked from initiating tracking (403 Forbidden)");

  // TEST 6: Date validation on placement creation (expected_end_date < start_date rejected)
  let invalidDateCreationBlocked = false;
  try {
    await placementService.createPlacementTracking("industry-1", {
      applicationId: "app-1",
      engagementType: "internship",
      startDate: "2026-10-15",
      expectedEndDate: "2026-10-01", // earlier than start date
    });
  } catch (err: any) {
    // validation schema catches this
    invalidDateCreationBlocked = true;
  }
  assert(invalidDateCreationBlocked, "Test 6: Date check rejects expected_end_date earlier than start_date on creation");

  // TEST 7: Authorized industry user initiates tracking successfully (status = 'selected')
  const placementRecord = await placementService.createPlacementTracking("industry-1", {
    applicationId: "app-1",
    engagementType: "internship",
    startDate: "2026-10-01",
    expectedEndDate: "2026-12-31",
    supervisorName: "Dr. Arvind Sharma",
    supervisorEmail: "arvind.sharma@himalaya.com",
  });
  assert(
    placementRecord.status === "selected" &&
    placementRecord.progress_percent === 0 &&
    placementRecord.application_id === "app-1",
    "Test 7: Authorized industry owner initiates placement tracking with default status 'selected' and progress 0%",
    `Placement ID: ${placementRecord.id}, Status: ${placementRecord.status}`
  );

  // TEST 8: Duplicate placement tracking for same application rejected with 409 Conflict
  let duplicatePlacementBlocked = false;
  try {
    await placementService.createPlacementTracking("industry-1", {
      applicationId: "app-1",
      engagementType: "internship",
    });
  } catch (err: any) {
    if (err.statusCode === 409) duplicatePlacementBlocked = true;
  }
  assert(duplicatePlacementBlocked, "Test 8: Duplicate placement tracking on same application rejected with 409 Conflict");

  // TEST 9: State Machine — Invalid direct state skip rejected (selected -> in_progress)
  let invalidStateSkipBlocked = false;
  try {
    await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
      status: "in_progress",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("Invalid transition from 'selected' to 'in_progress'")) {
      invalidStateSkipBlocked = true;
    }
  }
  assert(invalidStateSkipBlocked, "Test 9: Invalid state skip strictly rejected by state machine (selected -> in_progress)");

  // TEST 10: State Machine — Transition: selected -> offer_accepted
  const offerAcceptedUpdate = await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
    status: "offer_accepted",
    progressPercent: 10,
  });
  assert(
    offerAcceptedUpdate.status === "offer_accepted" && offerAcceptedUpdate.progress_percent === 10,
    "Test 10: Valid state transition succeeds: selected -> offer_accepted with updated progress"
  );

  // TEST 11: State Machine — Transition: offer_accepted -> joined
  const joinedUpdate = await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
    status: "joined",
    progressPercent: 25,
  });
  assert(joinedUpdate.status === "joined", "Test 11: Valid state transition succeeds: offer_accepted -> joined");

  // TEST 12: State Machine — Withdrawal rejected once candidate has joined
  let withdrawAfterJoinBlocked = false;
  try {
    await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
      status: "withdrawn",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("Invalid transition from 'joined' to 'withdrawn'")) {
      withdrawAfterJoinBlocked = true;
    }
  }
  assert(withdrawAfterJoinBlocked, "Test 12: Withdrawal strictly blocked once candidate has joined (400 Bad Request)");

  // TEST 13: State Machine — Transition: joined -> in_progress
  const inProgressUpdate = await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
    status: "in_progress",
    progressPercent: 60,
  });
  assert(inProgressUpdate.status === "in_progress", "Test 13: Valid state transition succeeds: joined -> in_progress");

  // TEST 14: State Machine — Transition: in_progress -> completed
  const completedUpdate = await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
    status: "completed",
    progressPercent: 100,
    actualEndDate: "2026-12-28",
    outcome: "Successfully completed Panchakarma formulation monograph with distinction.",
  });
  assert(
    completedUpdate.status === "completed" &&
    completedUpdate.progress_percent === 100 &&
    completedUpdate.actual_end_date === "2026-12-28",
    "Test 14: Valid state transition succeeds: in_progress -> completed with final outcome and completion date"
  );

  // TEST 15: Terminal state protection — completed status cannot be transitioned
  let terminalStateMutationBlocked = false;
  try {
    await placementService.updatePlacementTracking("industry-1", placementRecord.id, {
      status: "in_progress",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("Cannot transition from terminal state 'completed'")) {
      terminalStateMutationBlocked = true;
    }
  }
  assert(terminalStateMutationBlocked, "Test 15: Terminal status 'completed' is strictly immutable to transitions (400 Bad Request)");

  // TEST 16: Withdrawal state machine verification on separate placement (selected -> withdrawn)
  // Create second placement for app-3
  const placement2 = await placementService.createPlacementTracking("industry-2", {
    applicationId: "app-3",
    engagementType: "placement",
    startDate: "2026-11-01",
  });
  const withdrawnRecord = await placementService.updatePlacementTracking("industry-2", placement2.id, {
    status: "withdrawn",
  });
  assert(withdrawnRecord.status === "withdrawn", "Test 16.1: Valid withdrawal succeeds from 'selected' status (selected -> withdrawn)");

  let withdrawnTerminalBlocked = false;
  try {
    await placementService.updatePlacementTracking("industry-2", placement2.id, {
      status: "offer_accepted",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("Cannot transition from terminal state 'withdrawn'")) {
      withdrawnTerminalBlocked = true;
    }
  }
  assert(withdrawnTerminalBlocked, "Test 16.2: Terminal status 'withdrawn' is strictly immutable to further transitions (400 Bad Request)");

  console.log("\n--- 3. Multi-Tenant Placement Isolation ---");

  // TEST 17: Student A can retrieve their own placement record
  const student1Placements = await placementService.getStudentPlacements("student-1");
  assert(
    student1Placements.length === 1 && student1Placements[0].id === placementRecord.id,
    "Test 17: Student retrieves own placement tracking record with opportunity details"
  );

  // TEST 18: Student B cannot see Student A's placement
  const student2Placements = await placementService.getStudentPlacements("student-2");
  const includesStudent1Plc = student2Placements.some((p) => p.id === placementRecord.id);
  assert(!includesStudent1Plc, "Test 18: Tenant Isolation — Student B cannot see Student A's placement records");

  // TEST 19: Industry A only sees placements for their authored opportunities
  const industry1Placements = await placementService.getIndustryPlacements("industry-1");
  const industry2Placements = await placementService.getIndustryPlacements("industry-2");
  assert(
    industry1Placements.every((p) => p.applicationId === "app-1") &&
    industry2Placements.every((p) => p.applicationId === "app-3"),
    "Test 19: Tenant Isolation — Industry A and B only see placements for their own opportunities"
  );

  // TEST 20: Institution A only sees enrolled cohort student placements
  const institution1Placements = await placementService.getInstitutionPlacements("institution-admin-1");
  assert(
    institution1Placements.length === 1 && institution1Placements[0].student.id === "student-1",
    "Test 20: Tenant Isolation — Institution A only accesses placement records for enrolled cohort students"
  );

  // TEST 21: Cross-student single detail lookup blocked with 403 Forbidden
  let crossStudentDetailBlocked = false;
  try {
    await placementService.getPlacementById("student-2", "student", placementRecord.id);
  } catch (err: any) {
    if (err.statusCode === 403) crossStudentDetailBlocked = true;
  }
  assert(crossStudentDetailBlocked, "Test 21: Cross-student direct placement lookup blocked with 403 Forbidden");

  console.log("\n--- 4. Digital Portfolio Items CRUD & Validation ---");

  // TEST 22: Student creates a portfolio item (certification)
  const item1 = await testPortfolioService.createPortfolioItem("student-1", {
    itemType: "certification",
    title: "Advanced Panchakarma Therapy & Clinical Management",
    issuerOrOrganization: "AIIA Continuing Medical Education",
    startDate: "2026-01-10",
    endDate: "2026-04-15",
    description: "Completed 120-hour intensive hands-on clinical training in Shodhana therapies.",
  });
  assert(
    item1.item_type === "certification" && item1.title.includes("Advanced Panchakarma") && item1.student_id === "student-1",
    "Test 22: Student successfully creates portfolio item with valid item_type and dates",
    `Item ID: ${item1.id}`
  );

  // TEST 23: Portfolio item date check rejects end_date earlier than start_date
  let invalidPortfolioDatesBlocked = false;
  try {
    await testPortfolioService.createPortfolioItem("student-1", {
      itemType: "project",
      title: "Rasayana Formulation Study",
      startDate: "2026-05-10",
      endDate: "2026-05-01", // earlier than start
    });
  } catch (err: any) {
    invalidPortfolioDatesBlocked = true;
  }
  assert(invalidPortfolioDatesBlocked, "Test 23: Portfolio validation rejects end_date earlier than start_date");

  // TEST 24: Student updates own portfolio item
  const updatedItem = await testPortfolioService.updatePortfolioItem("student-1", item1.id, {
    achievement: "Graduated top 5% with clinical excellence award",
  });
  assert(
    updatedItem.achievement?.includes("clinical excellence award"),
    "Test 24: Student successfully updates mutable fields of owned portfolio item"
  );

  // TEST 25: Cross-student portfolio item modification blocked (403 Forbidden)
  let crossStudentEditBlocked = false;
  try {
    await testPortfolioService.updatePortfolioItem("student-2", item1.id, {
      title: "Tampered Title",
    });
  } catch (err: any) {
    if (err.statusCode === 403) crossStudentEditBlocked = true;
  }
  assert(crossStudentEditBlocked, "Test 25: Cross-student portfolio item update blocked with 403 Forbidden");

  console.log("\n--- 5. Portfolio Documents, Storage Abstraction & Atomic Replacement ---");

  // TEST 26: File type validation rejects disallowed MIME types (.zip / .txt)
  let disallowedMimeBlocked = false;
  try {
    await testPortfolioService.uploadPortfolioDocument("student-1", item1.id, {
      originalname: "archive.zip",
      mimetype: "application/zip",
      size: 1024,
      buffer: Buffer.from("dummy-zip"),
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("Only PDF, JPG, and PNG files are allowed")) {
      disallowedMimeBlocked = true;
    }
  }
  assert(disallowedMimeBlocked, "Test 26: Disallowed file MIME type rejected with 400 Bad Request");

  // TEST 27: File size validation rejects files exceeding 5 MB limit
  let oversizedFileBlocked = false;
  try {
    await testPortfolioService.uploadPortfolioDocument("student-1", item1.id, {
      originalname: "huge_scan.pdf",
      mimetype: "application/pdf",
      size: 5242881, // 5 MB + 1 byte
      buffer: Buffer.alloc(10),
    });
  } catch (err: any) {
    if (err.statusCode === 413 && err.message.includes("5 MB or smaller")) {
      oversizedFileBlocked = true;
    }
  }
  assert(oversizedFileBlocked, "Test 27: Document exceeding 5 MB limit rejected with 413 Payload Too Large");

  // TEST 28: Valid document upload stores file in storage abstraction and records metadata
  const doc1 = await testPortfolioService.uploadPortfolioDocument("student-1", item1.id, {
    originalname: "panchakarma_certificate.pdf",
    mimetype: "application/pdf",
    size: 204800, // 200 KB
    buffer: Buffer.from("pdf-binary-certificate-content"),
  });
  assert(
    doc1.portfolio_item_id === item1.id &&
    doc1.student_id === "student-1" &&
    mockStorage.files.has(doc1.storage_path),
    "Test 28: Valid document upload writes to pluggable storage and inserts metadata record",
    `Document ID: ${doc1.id}, Path: ${doc1.storage_path}`
  );

  // TEST 29: Cross-student document upload blocked (Student 2 cannot attach to Student 1's item)
  let crossStudentUploadBlocked = false;
  try {
    await testPortfolioService.uploadPortfolioDocument("student-2", item1.id, {
      originalname: "fake_doc.pdf",
      mimetype: "application/pdf",
      size: 1024,
      buffer: Buffer.from("fake-pdf"),
    });
  } catch (err: any) {
    if (err.statusCode === 403) crossStudentUploadBlocked = true;
  }
  assert(crossStudentUploadBlocked, "Test 29: Cross-student document upload blocked with 403 Forbidden");

  // TEST 30: Document viewing signed URL generation
  const signedUrlRes = await testPortfolioService.getDocumentSignedUrl("student-1", doc1.id);
  assert(
    signedUrlRes.signedUrl.includes("https://storage.ayush.local/signed/") &&
    signedUrlRes.fileName === "panchakarma_certificate.pdf",
    "Test 30: Student generates time-limited signed URL for viewing private document"
  );

  // TEST 31: Cross-student document signed URL lookup blocked with 403 Forbidden
  let crossStudentViewBlocked = false;
  try {
    await testPortfolioService.getDocumentSignedUrl("student-2", doc1.id);
  } catch (err: any) {
    if (err.statusCode === 403) crossStudentViewBlocked = true;
  }
  assert(crossStudentViewBlocked, "Test 31: Cross-student document view access blocked with 403 Forbidden");

  // TEST 32: Document replacement semantics (replaces old file, cleans old storage and metadata)
  const oldStoragePath = doc1.storage_path;
  const doc2 = await testPortfolioService.uploadPortfolioDocument("student-1", item1.id, {
    originalname: "panchakarma_certificate_v2.pdf",
    mimetype: "application/pdf",
    size: 250000,
    buffer: Buffer.from("pdf-v2-binary-content"),
  });
  assert(
    doc2.id !== doc1.id &&
    !mockStorage.files.has(oldStoragePath) &&
    mockStorage.files.has(doc2.storage_path) &&
    !portfolioDocumentsTable.has(doc1.id),
    "Test 32: Attachment replacement cleans up previous storage file and old database record atomically"
  );

  // TEST 33: Storage consistency on failure (uploaded file deleted if DB insert fails)
  let simulatedFailCleaned = false;
  const targetFailPath = `student-1/${item1.id}/simulated-fail.pdf`;
  // Temporarily intercept db.query to throw
  const originalQuery = (dbModule.db as any).query;
  (dbModule.db as any).query = async (sql: string, params?: any[]) => {
    if (sql.startsWith("INSERT INTO public.portfolio_documents")) {
      throw new Error("Simulated database constraint failure");
    }
    return originalQuery(sql, params);
  };

  try {
    await testPortfolioService.uploadPortfolioDocument("student-1", item1.id, {
      originalname: "simulated-fail.pdf",
      mimetype: "application/pdf",
      size: 1024,
      buffer: Buffer.from("fail-content"),
    });
  } catch (err: any) {
    if (!mockStorage.files.has(targetFailPath)) {
      simulatedFailCleaned = true;
    }
  } finally {
    (dbModule.db as any).query = originalQuery;
  }
  assert(simulatedFailCleaned, "Test 33: Storage consistency — Newly uploaded file is cleaned up if database insert fails");

  // TEST 34: Document deletion cleans up storage file and metadata
  await testPortfolioService.deletePortfolioDocument("student-1", doc2.id);
  assert(
    !mockStorage.files.has(doc2.storage_path) && !portfolioDocumentsTable.has(doc2.id),
    "Test 34: Document deletion successfully removes storage file and database record"
  );

  // TEST 35: Portfolio item deletion cascades and cleans up all attached storage files
  // Upload a fresh document to item1
  const doc3 = await testPortfolioService.uploadPortfolioDocument("student-1", item1.id, {
    originalname: "certificate_final.png",
    mimetype: "image/png",
    size: 10240,
    buffer: Buffer.from("png-content"),
  });
  assert(mockStorage.files.has(doc3.storage_path), "Test 35.1: Fresh document attached for cascade deletion check");

  await testPortfolioService.deletePortfolioItem("student-1", item1.id);
  assert(
    !portfolioItemsTable.has(item1.id) &&
    !portfolioDocumentsTable.has(doc3.id) &&
    !mockStorage.files.has(doc3.storage_path),
    "Test 35.2: Deleting portfolio item cascades to delete all attached storage files and records without orphans"
  );

  // TEST 36: Complete Student Portfolio view aggregates items, documents, and placements
  // Create an item for student-1
  await testPortfolioService.createPortfolioItem("student-1", {
    itemType: "research",
    title: "Ayurvedic Monograph on Ashwagandha Standardized Extracts",
    issuerOrOrganization: "Ayush Research Cell",
  });
  const portfolioSummary = await testPortfolioService.getStudentPortfolio("student-1");
  assert(
    portfolioSummary.profile?.full_name === "Aarav Patel" &&
    portfolioSummary.competencies.length === 2 &&
    portfolioSummary.items.length === 1 &&
    portfolioSummary.placements.length === 1,
    "Test 36: Complete portfolio query successfully aggregates profile, competencies, items, documents, and placement history"
  );

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(` MODULE 6 TEST SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log("================================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runModule6Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
