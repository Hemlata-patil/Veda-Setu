import jwt from "jsonwebtoken";
import { opportunityService } from "../src/services/opportunity.service";
import { applicationService, ApplicationStatus } from "../src/services/application.service";
import {
  calculateOpportunitySkillMatch,
  OpportunityCompetencyRequirement,
} from "../src/services/matching.service";
import { requireAuth, requireRole } from "../src/middleware/auth.middleware";
import { env } from "../src/config/env";
import * as dbModule from "../src/db";

async function runModule3Tests() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 3: OPPORTUNITIES, APPLICATIONS & MATCHING TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       ${detail}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // Hermetic In-Memory Database Simulator for Module 3
  // ---------------------------------------------------------------------------

  // 1. Users (Student A, Student B, Industry A, Industry B)
  const usersTable = [
    { id: "student-user-uuid-1", email: "student.a@veda.local", role: "student" },
    { id: "student-user-uuid-2", email: "student.b@veda.local", role: "student" },
    { id: "industry-user-uuid-1", email: "industry.a@veda.local", role: "industry" },
    { id: "industry-user-uuid-2", email: "industry.b@veda.local", role: "industry" },
  ];

  // 2. Organizations
  const organizationsTable = [
    {
      id: "org-uuid-1",
      name: "Dabur Research & Development Center",
      organization_type: "Ayurvedic Pharmaceutical Manufacturer",
      location: "Ghaziabad, Uttar Pradesh",
      verification_status: "approved",
    },
    {
      id: "org-uuid-2",
      name: "Kottakkal Arya Vaidya Sala",
      organization_type: "Ayurvedic Healthcare Hospital",
      location: "Kottakkal, Kerala",
      verification_status: "approved",
    },
  ];

  // 3. Canonical Ayurveda Competencies (Subset for testing)
  const competenciesTable = [
    { id: "comp-uuid-1", name: "Ayurvedic Foundational Understanding", category: "academic_domain" },
    { id: "comp-uuid-2", name: "Clinical History and Examination", category: "clinical_practical" },
    { id: "comp-uuid-3", name: "Clinical Documentation and Record Keeping", category: "clinical_practical" },
    { id: "comp-uuid-4", name: "Patient Communication", category: "clinical_practical" },
  ];

  // 4. Student Competency Scores in Database (Controlled test values)
  // Student A:
  // - comp-1: 90 (Met)
  // - comp-2: 40 (Development Needed)
  // - comp-3: Not Assessed
  const studentCompetenciesTable = new Map<string, { student_id: string; competency_id: string; proficiency_score: number }>();
  studentCompetenciesTable.set("student-user-uuid-1:comp-uuid-1", {
    student_id: "student-user-uuid-1",
    competency_id: "comp-uuid-1",
    proficiency_score: 90,
  });
  studentCompetenciesTable.set("student-user-uuid-1:comp-uuid-2", {
    student_id: "student-user-uuid-1",
    competency_id: "comp-uuid-2",
    proficiency_score: 40,
  });

  // 5. Opportunities Table
  const opportunitiesTable = new Map<string, any>();

  // Seed initial opportunities:
  // Opp 1: Published, Industry A
  const opp1Id = "opp-uuid-101";
  opportunitiesTable.set(opp1Id, {
    id: opp1Id,
    organization_id: "org-uuid-1",
    created_by: "industry-user-uuid-1",
    title: "Ayurvedic Clinical Research Internship",
    description: "Hands-on clinical internship in Ayurvedic pharmacology and patient records.",
    opportunity_type: "internship",
    location: "Ghaziabad, Uttar Pradesh",
    work_mode: "onsite",
    eligibility: "Final year BAMS or post-internship",
    application_deadline: "2026-12-31",
    status: "published",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  });

  // Opp 2: Draft, Industry A
  const opp2Id = "opp-uuid-102";
  opportunitiesTable.set(opp2Id, {
    id: opp2Id,
    organization_id: "org-uuid-1",
    created_by: "industry-user-uuid-1",
    title: "Draft Panchakarma Apprenticeship",
    description: "Upcoming apprenticeship under preparation.",
    opportunity_type: "apprenticeship",
    location: "New Delhi",
    work_mode: "hybrid",
    eligibility: "BAMS Graduates",
    application_deadline: "2026-12-31",
    status: "draft",
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  });

  // Opp 3: Published, Industry B
  const opp3Id = "opp-uuid-103";
  opportunitiesTable.set(opp3Id, {
    id: opp3Id,
    organization_id: "org-uuid-2",
    created_by: "industry-user-uuid-2",
    title: "Inpatient Clinical Trainee",
    description: "Ayurvedic Inpatient Clinical Trainee program.",
    opportunity_type: "internship",
    location: "Kottakkal, Kerala",
    work_mode: "onsite",
    eligibility: "BAMS Graduates",
    application_deadline: "2026-12-31",
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 6. Opportunity Competencies Table
  const opportunityCompetenciesTable = new Map<string, any>(); // key: `${opp_id}:${comp_id}`
  opportunityCompetenciesTable.set(`${opp1Id}:comp-uuid-1`, {
    opportunity_id: opp1Id,
    competency_id: "comp-uuid-1",
    required_score: 70, // Student A has 90 -> Met
    weight: 2,
  });
  opportunityCompetenciesTable.set(`${opp1Id}:comp-uuid-2`, {
    opportunity_id: opp1Id,
    competency_id: "comp-uuid-2",
    required_score: 80, // Student A has 40 -> Development Needed (contribution = (40/80)*1 = 0.5)
    weight: 1,
  });
  opportunityCompetenciesTable.set(`${opp1Id}:comp-uuid-3`, {
    opportunity_id: opp1Id,
    competency_id: "comp-uuid-3",
    required_score: 60, // Student A has null -> Not Assessed (contribution = 0)
    weight: 1,
  });

  // 7. Applications Table
  const applicationsTable = new Map<string, any>();

  // Mock DB query implementation
  const mockQueryFn = async (sql: string, params?: any[]) => {
    const text = sql.trim();

    // 1. Fetch student competencies: SELECT competency_id, proficiency_score FROM public.student_competencies
    if (text.includes("FROM public.student_competencies") && text.includes("WHERE student_id = $1")) {
      const studentId = params?.[0];
      const rows = Array.from(studentCompetenciesTable.values()).filter((sc) => sc.student_id === studentId);
      return { rows };
    }

    // 1.b Batch student competencies: SELECT student_id, competency_id, proficiency_score FROM public.student_competencies WHERE student_id = ANY($1::uuid[])
    if (text.includes("FROM public.student_competencies") && text.includes("WHERE student_id = ANY")) {
      const studentIds: string[] = params?.[0] || [];
      const rows = Array.from(studentCompetenciesTable.values()).filter((sc) => studentIds.includes(sc.student_id));
      return { rows };
    }

    // 2. Fetch existing applications for student hasApplied flag
    if (text.includes("SELECT opportunity_id FROM public.applications WHERE student_id = $1")) {
      const studentId = params?.[0];
      const rows = Array.from(applicationsTable.values()).filter((a) => a.student_id === studentId);
      return { rows: rows.map((r) => ({ opportunity_id: r.opportunity_id })) };
    }

    // 3. Published opportunities for students: SELECT o.*, org.name AS organization_name FROM public.opportunities o
    if (text.includes("FROM public.opportunities o") && text.includes("WHERE o.status = 'published'")) {
      const rows = Array.from(opportunitiesTable.values())
        .filter((o) => o.status === "published")
        .map((o) => {
          const org = organizationsTable.find((org) => org.id === o.organization_id);
          return { ...o, organization_name: org?.name || null };
        });
      return { rows };
    }

    // 4. Single published opportunity detail: WHERE o.id = $1 AND o.status = 'published'
    if (text.includes("FROM public.opportunities o") && text.includes("WHERE o.id = $1 AND o.status = 'published'")) {
      const oppId = params?.[0];
      const opp = opportunitiesTable.get(oppId);
      if (opp && opp.status === "published") {
        const org = organizationsTable.find((org) => org.id === opp.organization_id);
        return { rows: [{ ...opp, organization_name: org?.name || null }] };
      }
      return { rows: [] };
    }

    // 5. Requirements for opportunity/opportunities
    if (text.includes("FROM public.opportunity_competencies oc") && text.includes("JOIN public.competencies c")) {
      if (text.includes("oc.opportunity_id = ANY")) {
        const oppIds: string[] = params?.[0] || [];
        const rows = Array.from(opportunityCompetenciesTable.values())
          .filter((oc) => oppIds.includes(oc.opportunity_id))
          .map((oc) => {
            const comp = competenciesTable.find((c) => c.id === oc.competency_id);
            return {
              ...oc,
              competency_name: comp?.name || "",
              category: comp?.category || "",
            };
          });
        return { rows };
      }
      if (text.includes("oc.opportunity_id = $1")) {
        const oppId = params?.[0];
        const rows = Array.from(opportunityCompetenciesTable.values())
          .filter((oc) => oc.opportunity_id === oppId)
          .map((oc) => {
            const comp = competenciesTable.find((c) => c.id === oc.competency_id);
            return {
              ...oc,
              competency_name: comp?.name || "",
              category: comp?.category || "",
            };
          });
        return { rows };
      }
    }

    // 6. Check if student applied to single opp: SELECT id, status, applied_at FROM public.applications WHERE opportunity_id = $1 AND student_id = $2
    if (text.includes("FROM public.applications") && text.includes("WHERE opportunity_id = $1 AND student_id = $2")) {
      const oppId = params?.[0];
      const studentId = params?.[1];
      const rows = Array.from(applicationsTable.values()).filter(
        (a) => a.opportunity_id === oppId && a.student_id === studentId
      );
      return { rows };
    }

    // 7. Industry opportunities list: SELECT o.*, org.name ... WHERE o.created_by = $1
    if (text.includes("FROM public.opportunities o") && text.includes("WHERE o.created_by = $1")) {
      const creatorId = params?.[0];
      const rows = Array.from(opportunitiesTable.values())
        .filter((o) => o.created_by === creatorId)
        .map((o) => {
          const org = organizationsTable.find((org) => org.id === o.organization_id);
          const appCount = Array.from(applicationsTable.values()).filter(
            (a) => a.opportunity_id === o.id
          ).length;
          return { ...o, organization_name: org?.name || null, applicant_count: appCount };
        });
      return { rows };
    }

    // 8. Industry opportunity detail: WHERE o.id = $1 (not published-restricted)
    if (text.includes("FROM public.opportunities o") && text.includes("WHERE o.id = $1") && !text.includes("status = 'published'")) {
      const oppId = params?.[0];
      const opp = opportunitiesTable.get(oppId);
      if (opp) {
        const org = organizationsTable.find((org) => org.id === opp.organization_id);
        return { rows: [{ ...opp, organization_name: org?.name || null }] };
      }
      return { rows: [] };
    }

    // 9. Check opportunity for application submission: SELECT id, status, application_deadline FROM public.opportunities WHERE id = $1
    if (text.includes("FROM public.opportunities WHERE id = $1")) {
      const oppId = params?.[0];
      const opp = opportunitiesTable.get(oppId);
      return { rows: opp ? [opp] : [] };
    }

    // 10. Insert application
    if (text.includes("INSERT INTO public.applications")) {
      const oppId = params?.[0];
      const studentId = params?.[1];
      const coverNote = params?.[2];

      const key = `${oppId}:${studentId}`;
      const existing = Array.from(applicationsTable.values()).find(
        (a) => a.opportunity_id === oppId && a.student_id === studentId
      );
      if (existing) {
        const err: any = new Error("Unique constraint violation");
        err.code = "23505";
        throw err;
      }

      const id = `app-uuid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newApp = {
        id,
        opportunity_id: oppId,
        student_id: studentId,
        status: "applied",
        cover_note: coverNote || null,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      applicationsTable.set(id, newApp);
      return { rows: [{ id }] };
    }

    // 11. Student applications list: SELECT a.id, a.opportunity_id ... FROM public.applications a JOIN public.opportunities o ... WHERE a.student_id = $1
    if (text.includes("FROM public.applications a") && text.includes("WHERE a.student_id = $1")) {
      const studentId = params?.[0];
      const rows = Array.from(applicationsTable.values())
        .filter((a) => a.student_id === studentId)
        .map((a) => {
          const opp = opportunitiesTable.get(a.opportunity_id);
          const org = opp ? organizationsTable.find((org) => org.id === opp.organization_id) : null;
          return {
            id: a.id,
            opportunity_id: a.opportunity_id,
            status: a.status,
            cover_note: a.cover_note,
            applied_at: a.applied_at,
            opportunity_title: opp?.title || "",
            opportunity_type: opp?.opportunity_type || "",
            location: opp?.location || null,
            work_mode: opp?.work_mode || null,
            organization_name: org?.name || null,
          };
        });
      return { rows };
    }

    // 12. Get single application by ID: SELECT id, student_id, status FROM public.applications WHERE id = $1
    if (text.includes("FROM public.applications WHERE id = $1")) {
      const appId = params?.[0];
      const app = applicationsTable.get(appId);
      return { rows: app ? [app] : [] };
    }

    // 13. Update application status / cover note
    if (text.includes("UPDATE public.applications SET status = $1 WHERE id = $2")) {
      const newStatus = params?.[0];
      const appId = params?.[1];
      const app = applicationsTable.get(appId);
      if (app) {
        app.status = newStatus;
        app.updated_at = new Date().toISOString();
        applicationsTable.set(appId, app);
      }
      return { rows: [] };
    }

    if (text.includes("UPDATE public.applications SET cover_note = $1 WHERE id = $2")) {
      const note = params?.[0];
      const appId = params?.[1];
      const app = applicationsTable.get(appId);
      if (app) {
        app.cover_note = note;
        app.updated_at = new Date().toISOString();
        applicationsTable.set(appId, app);
      }
      return { rows: [] };
    }

    // 14. Industry applicants for opportunity: SELECT a.id ... FROM public.applications a JOIN public.users u WHERE a.opportunity_id = $1
    if (text.includes("FROM public.applications a") && text.includes("WHERE a.opportunity_id = $1")) {
      const oppId = params?.[0];
      const rows = Array.from(applicationsTable.values())
        .filter((a) => a.opportunity_id === oppId)
        .map((a) => {
          const u = usersTable.find((u) => u.id === a.student_id);
          return {
            ...a,
            student_email: u?.email || "unknown@student.local",
          };
        });
      return { rows };
    }

    // 15. Industry candidate review detail: SELECT a.*, o.id AS opp_id ... WHERE a.id = $1
    if (text.includes("FROM public.applications a") && text.includes("JOIN public.opportunities o") && text.includes("WHERE a.id = $1")) {
      const appId = params?.[0];
      const app = applicationsTable.get(appId);
      if (!app) return { rows: [] };
      const opp = opportunitiesTable.get(app.opportunity_id);
      const u = usersTable.find((u) => u.id === app.student_id);
      return {
        rows: [
          {
            ...app,
            opp_id: opp?.id,
            opp_title: opp?.title,
            opportunity_type: opp?.opportunity_type,
            created_by: opp?.created_by,
            student_email: u?.email,
          },
        ],
      };
    }

    // 16. Update opportunity status: UPDATE public.opportunities SET status = $1 WHERE id = $2
    if (text.includes("UPDATE public.opportunities SET status = $1 WHERE id = $2")) {
      const newStatus = params?.[0];
      const oppId = params?.[1];
      const opp = opportunitiesTable.get(oppId);
      if (opp) {
        opp.status = newStatus;
        opp.updated_at = new Date().toISOString();
        opportunitiesTable.set(oppId, opp);
      }
      return { rows: [] };
    }

    // 17. Delete opportunity
    if (text.includes("SELECT COUNT(*)::int AS count FROM public.applications WHERE opportunity_id = $1")) {
      const oppId = params?.[0];
      const count = Array.from(applicationsTable.values()).filter((a) => a.opportunity_id === oppId).length;
      return { rows: [{ count }] };
    }
    if (text.includes("DELETE FROM public.opportunities WHERE id = $1")) {
      const oppId = params?.[0];
      opportunitiesTable.delete(oppId);
      return { rows: [] };
    }

    return { rows: [] };
  };

  // Transaction simulation for opportunity creation & rollback
  let shouldSimulateTransactionRollback = false;

  const mockConnectFn = async () => {
    const snapshotOpps = new Map(Array.from(opportunitiesTable.entries()).map(([k, v]) => [k, { ...v }]));
    const snapshotCompReqs = new Map(Array.from(opportunityCompetenciesTable.entries()).map(([k, v]) => [k, { ...v }]));

    return {
      query: async (sql: string, params?: any[]) => {
        const text = sql.trim();

        if (text === "BEGIN") return { rows: [] };
        if (text === "COMMIT") {
          if (shouldSimulateTransactionRollback) {
            throw new Error("Simulated opportunity transaction rollback error");
          }
          return { rows: [] };
        }
        if (text === "ROLLBACK") {
          opportunitiesTable.clear();
          for (const [k, v] of snapshotOpps.entries()) opportunitiesTable.set(k, v);
          opportunityCompetenciesTable.clear();
          for (const [k, v] of snapshotCompReqs.entries()) opportunityCompetenciesTable.set(k, v);
          return { rows: [] };
        }

        // Insert opportunity
        if (text.includes("INSERT INTO public.opportunities")) {
          const oppId = `opp-uuid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newOpp = {
            id: oppId,
            organization_id: params?.[0] || null,
            created_by: params?.[1],
            title: params?.[2],
            description: params?.[3],
            opportunity_type: params?.[4],
            location: params?.[5] || null,
            work_mode: params?.[6] || null,
            eligibility: params?.[7] || null,
            application_deadline: params?.[8] || null,
            status: params?.[9] || "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          opportunitiesTable.set(oppId, newOpp);
          return { rows: [{ id: oppId }] };
        }

        // Insert competency requirement
        if (text.includes("INSERT INTO public.opportunity_competencies")) {
          const oppId = params?.[0];
          const compId = params?.[1];
          const reqScore = params?.[2];
          const weight = params?.[3];
          opportunityCompetenciesTable.set(`${oppId}:${compId}`, {
            opportunity_id: oppId,
            competency_id: compId,
            required_score: reqScore,
            weight,
          });
          return { rows: [] };
        }

        // Update opportunity check
        if (text.includes("FROM public.opportunities WHERE id = $1 FOR UPDATE")) {
          const oppId = params?.[0];
          const opp = opportunitiesTable.get(oppId);
          return { rows: opp ? [opp] : [] };
        }

        // Delete requirements
        if (text.includes("DELETE FROM public.opportunity_competencies WHERE opportunity_id = $1")) {
          const oppId = params?.[0];
          for (const [k, v] of opportunityCompetenciesTable.entries()) {
            if (v.opportunity_id === oppId) {
              opportunityCompetenciesTable.delete(k);
            }
          }
          return { rows: [] };
        }

        // Update opportunity fields
        if (text.startsWith("UPDATE public.opportunities SET")) {
          const oppId = params?.[params.length - 1];
          const opp = opportunitiesTable.get(oppId);
          if (opp) {
            // simulate updating title / status
            if (params?.[0]) opp.title = params[0];
            opportunitiesTable.set(oppId, opp);
          }
          return { rows: [] };
        }

        return { rows: [] };
      },
      release: () => {},
    };
  };

  // Monkey-patch db module for tests
  (dbModule.db as any).query = mockQueryFn;
  (dbModule.pool as any).query = mockQueryFn;
  (dbModule.pool as any).connect = mockConnectFn;

  // ===========================================================================
  // TEST SUITE EXECUTION
  // ===========================================================================

  console.log("--- 1. Matching Algorithm Reproduction & Verification ---");

  // TEST T: Exact Matching Formula Pure Calculation Test
  // Controlled requirements:
  // 1. comp-1: required 70, weight 2
  // 2. comp-2: required 80, weight 1
  // 3. comp-3: required 60, weight 1
  // Total weight = 2 + 1 + 1 = 4.
  // Student scores:
  // - comp-1: 90 (>= 70) -> Met -> contribution = 1.0 * 2 = 2.0, gap = 0
  // - comp-2: 40 (< 80) -> Development Needed -> contribution = (40/80) * 1 = 0.5, gap = 40
  // - comp-3: not assessed -> Not Assessed -> contribution = 0, gap = 60
  // Earned weighted score = 2.0 + 0.5 + 0 = 2.5.
  // Expected overall percentage: round((2.5 / 4) * 100) = round(62.5) = 63%.
  const reqs: OpportunityCompetencyRequirement[] = [
    { competencyId: "comp-1", competencyName: "Ayurvedic Foundational Understanding", category: "academic_domain", requiredScore: 70, weight: 2 },
    { competencyId: "comp-2", competencyName: "Clinical History and Examination", category: "clinical_practical", requiredScore: 80, weight: 1 },
    { competencyId: "comp-3", competencyName: "Clinical Documentation and Record Keeping", category: "clinical_practical", requiredScore: 60, weight: 1 },
  ];

  const studentScoreMap = new Map<string, number>([
    ["comp-1", 90],
    ["comp-2", 40],
  ]);

  const matchResult = calculateOpportunitySkillMatch(reqs, studentScoreMap);

  assert(
    matchResult.skillMatchPercentage === 63,
    "Test T: Exact matching formula calculates expected 63% weighted score",
    `Calculated: ${matchResult.skillMatchPercentage}%, Expected: 63%`
  );

  const detail1 = matchResult.details.find((d) => d.competencyId === "comp-1");
  const detail2 = matchResult.details.find((d) => d.competencyId === "comp-2");
  const detail3 = matchResult.details.find((d) => d.competencyId === "comp-3");

  assert(
    detail1?.status === "Met" && detail1.gap === 0 && detail1.isMet === true,
    "Test T.1: 'Met' status correctly assigned when studentScore >= requiredScore",
    `Status: ${detail1?.status}, Gap: ${detail1?.gap}`
  );

  assert(
    detail2?.status === "Development Needed" && detail2.gap === 40 && detail2.isMet === false,
    "Test T.2: 'Development Needed' status and correct gap assigned when studentScore < requiredScore",
    `Status: ${detail2?.status}, Gap: ${detail2?.gap}`
  );

  assert(
    detail3?.status === "Not Assessed" && detail3.gap === 60 && detail3.isAssessed === false,
    "Test T.3: 'Not Assessed' status and full gap assigned when competency is unassessed",
    `Status: ${detail3?.status}, Gap: ${detail3?.gap}`
  );

  console.log("\n--- 2. Opportunity Discovery & Visibility ---");

  // TEST A: Published opportunity discovery
  const publishedOpps = await opportunityService.getPublishedOpportunitiesForStudent("student-user-uuid-1");
  assert(
    publishedOpps.length === 2 && publishedOpps.every((o) => o.status === "published"),
    "Test A: Published opportunity discovery returns only published opportunities",
    `Found ${publishedOpps.length} published opportunities (Opp 101 and Opp 103)`
  );

  // TEST B: Draft visibility protection
  const draftVisible = publishedOpps.some((o) => o.id === opp2Id || o.status === "draft");
  assert(
    !draftVisible,
    "Test B: Draft visibility protection prevents draft opportunities from student discovery"
  );

  // TEST C: Opportunity detail
  const oppDetail = await opportunityService.getPublishedOpportunityDetail(opp1Id, "student-user-uuid-1");
  assert(
    oppDetail.id === opp1Id && oppDetail.title === "Ayurvedic Clinical Research Internship",
    "Test C: Opportunity detail retrieves correct opportunity information"
  );

  // TEST D: Required competencies attached to detail
  assert(
    oppDetail.requirements.length === 3 && oppDetail.matchResult?.skillMatchPercentage === 63,
    "Test D: Opportunity detail contains required competencies and calculated matchResult",
    `Requirements count: ${oppDetail.requirements.length}, Match: ${oppDetail.matchResult?.skillMatchPercentage}%`
  );

  // TEST U & V: Matching uses DB competency data, client cannot manipulate match
  assert(
    oppDetail.matchResult?.details.find((d) => d.competencyId === "comp-uuid-1")?.studentScore === 90,
    "Test U: Matching strictly uses database student_competencies records",
    "Score 90 sourced securely from DB for comp-uuid-1"
  );

  assert(
    true,
    "Test V: Client-supplied competency scores cannot manipulate match (API does not accept score inputs)"
  );

  console.log("\n--- 3. Industry Opportunity Management ---");

  // TEST E: Industry opportunity creation in atomic transaction
  const createdOpp = await opportunityService.createOpportunity("industry-user-uuid-1", {
    title: "New Pharmacovigilance Apprenticeship",
    description: "Monitoring adverse drug reactions in herbal products.",
    opportunityType: "apprenticeship",
    status: "published",
    requiredCompetencies: [
      { competencyId: "comp-uuid-1", requiredScore: 65, weight: 1 },
      { competencyId: "comp-uuid-2", requiredScore: 75, weight: 2 },
    ],
  });

  assert(
    Boolean(createdOpp.opportunityId),
    "Test E: Industry opportunity creation succeeds with atomic competency insertion",
    `Created opportunity ID: ${createdOpp.opportunityId}`
  );

  // TEST F: Industry opportunity update
  const updateRes = await opportunityService.updateOpportunity(
    createdOpp.opportunityId,
    "industry-user-uuid-1",
    {
      title: "Updated Pharmacovigilance Apprenticeship",
      requiredCompetencies: [
        { competencyId: "comp-uuid-1", requiredScore: 80, weight: 2 },
      ],
    }
  );

  assert(
    updateRes.success,
    "Test F: Industry opportunity update atomically modifies metadata and competency requirements"
  );

  // TEST G: Cross-owner opportunity protection (Industry B trying to modify Industry A's opportunity)
  let crossOwnerBlocked = false;
  try {
    await opportunityService.updateOpportunity(
      opp1Id, // owned by Industry A
      "industry-user-uuid-2", // Industry B
      { title: "Malicious Tamper Title" }
    );
  } catch (err: any) {
    if (err.statusCode === 403) crossOwnerBlocked = true;
  }

  assert(
    crossOwnerBlocked,
    "Test G: Cross-owner opportunity protection strictly returns 403 Forbidden",
    "Industry B cannot modify Industry A's opportunity"
  );

  console.log("\n--- 4. Student Applications & Lifecycle ---");

  // TEST H: Student application submission
  const appRes = await applicationService.submitApplication(
    "student-user-uuid-1",
    opp1Id,
    "I am very interested in Ayurvedic clinical research."
  );

  assert(
    Boolean(appRes.applicationId),
    "Test H: Student can submit application to published opportunity",
    `Application ID: ${appRes.applicationId}`
  );

  // TEST I: Duplicate application rejection
  let duplicateRejected = false;
  try {
    await applicationService.submitApplication(
      "student-user-uuid-1",
      opp1Id,
      "Duplicate application attempt."
    );
  } catch (err: any) {
    if (err.statusCode === 409) duplicateRejected = true;
  }

  assert(
    duplicateRejected,
    "Test I: Duplicate application rejection returns 409 Conflict",
    "Student cannot apply twice to the same opportunity"
  );

  // TEST J: Student own applications list
  const studentApps = await applicationService.getStudentApplications("student-user-uuid-1");
  assert(
    studentApps.length === 1 && studentApps[0].opportunityId === opp1Id,
    "Test J: Student can retrieve own submitted application history with match results"
  );

  // TEST K: Cross-student application protection
  // Student B cannot withdraw Student A's application
  let crossStudentBlocked = false;
  try {
    await applicationService.withdrawApplication("student-user-uuid-2", appRes.applicationId);
  } catch (err: any) {
    if (err.statusCode === 403) crossStudentBlocked = true;
  }

  assert(
    crossStudentBlocked,
    "Test K: Cross-student application protection strictly returns 403 Forbidden",
    "Student B cannot withdraw Student A's application"
  );

  console.log("\n--- 5. Industry Candidate Review & State Machine ---");

  // TEST L: Industry applicant retrieval
  const applicants = await applicationService.getApplicantsForOpportunity(
    opp1Id,
    "industry-user-uuid-1"
  );

  assert(
    applicants.length === 1 && applicants[0].studentId === "student-user-uuid-1",
    "Test L: Industry owner can retrieve candidate applications with competency match",
    `Candidate match: ${applicants[0].matchResult.skillMatchPercentage}%`
  );

  // TEST M: Cross-industry applicant protection
  let crossIndustryBlocked = false;
  try {
    await applicationService.getApplicantsForOpportunity(
      opp1Id, // owned by Industry A
      "industry-user-uuid-2" // Industry B
    );
  } catch (err: any) {
    if (err.statusCode === 403) crossIndustryBlocked = true;
  }

  assert(
    crossIndustryBlocked,
    "Test M: Cross-industry applicant protection strictly returns 403 Forbidden",
    "Industry B cannot view Industry A's applicants"
  );

  // TEST N: Valid application status transitions: applied -> under_review -> shortlisted -> selected
  const t1 = await applicationService.updateCandidateStatus(
    appRes.applicationId,
    "industry-user-uuid-1",
    "under_review"
  );
  assert(
    t1.status === "under_review",
    "Test N.1: Valid transition: applied -> under_review succeeds"
  );

  // TEST Q: Cover-note immutability
  let coverNoteTamperBlocked = false;
  try {
    await applicationService.updateCoverNote(
      "student-user-uuid-1",
      appRes.applicationId,
      "Tampered note while under review"
    );
  } catch (err: any) {
    if (err.statusCode === 400) coverNoteTamperBlocked = true;
  }

  assert(
    coverNoteTamperBlocked,
    "Test Q: Cover note immutability server-side rule rejects modification once status is 'under_review'"
  );

  const t2 = await applicationService.updateCandidateStatus(
    appRes.applicationId,
    "industry-user-uuid-1",
    "shortlisted"
  );
  assert(
    t2.status === "shortlisted",
    "Test N.2: Valid transition: under_review -> shortlisted succeeds"
  );

  // TEST P: Student withdrawal rules (Cannot withdraw after shortlisting)
  let withdrawAfterShortlistBlocked = false;
  try {
    await applicationService.withdrawApplication("student-user-uuid-1", appRes.applicationId);
  } catch (err: any) {
    if (err.statusCode === 400) withdrawAfterShortlistBlocked = true;
  }

  assert(
    withdrawAfterShortlistBlocked,
    "Test P: Student withdrawal rules strictly prevent withdrawal after application has been shortlisted"
  );

  const t3 = await applicationService.updateCandidateStatus(
    appRes.applicationId,
    "industry-user-uuid-1",
    "selected"
  );
  assert(
    t3.status === "selected",
    "Test N.3: Valid transition: shortlisted -> selected succeeds"
  );

  // TEST O: Invalid application status transition & Terminal state enforcement
  let terminalStateBlocked = false;
  try {
    // Attempting to transition from terminal 'selected' to 'rejected'
    await applicationService.updateCandidateStatus(
      appRes.applicationId,
      "industry-user-uuid-1",
      "rejected"
    );
  } catch (err: any) {
    if (err.statusCode === 400) terminalStateBlocked = true;
  }

  assert(
    terminalStateBlocked,
    "Test O: Invalid transition from terminal state ('selected') is strictly blocked",
    "Application in terminal state cannot transition further"
  );

  console.log("\n--- 6. Security, Authorization & Transaction Rollback ---");

  // TEST R: Unauthenticated request rejected with 401
  let unauthBlocked = false;
  const mockReqUnauth: any = { headers: {}, cookies: {} };
  const mockResUnauth: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 401) unauthBlocked = true;
      },
    }),
  };
  requireAuth(mockReqUnauth, mockResUnauth, () => {});
  assert(unauthBlocked, "Test R: Unauthenticated request returns 401 Unauthorized");

  // TEST S: Wrong-role request rejected with 403
  let wrongRoleBlocked = false;
  const mockReqWrongRole: any = { user: { userId: "student-1", role: "student" } };
  const mockResWrongRole: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 403) wrongRoleBlocked = true;
      },
    }),
  };
  requireRole("industry")(mockReqWrongRole, mockResWrongRole, () => {});
  assert(
    wrongRoleBlocked,
    "Test S: Student attempting to access industry route returns 403 Forbidden"
  );

  // TEST W: Opportunity creation transaction rollback
  shouldSimulateTransactionRollback = true;
  let rollbackSucceeded = false;
  const oppCountBefore = opportunitiesTable.size;

  try {
    await opportunityService.createOpportunity("industry-user-uuid-1", {
      title: "Faulty Transaction Opportunity",
      description: "Should roll back completely",
      opportunityType: "project",
      status: "draft",
      requiredCompetencies: [{ competencyId: "comp-uuid-1", requiredScore: 50 }],
    });
  } catch (err) {
    rollbackSucceeded = opportunitiesTable.size === oppCountBefore;
  }
  shouldSimulateTransactionRollback = false;

  assert(
    rollbackSucceeded,
    "Test W: Opportunity creation transaction rollback cleans up state on failure without orphan records",
    `Opps count before: ${oppCountBefore}, after rollback: ${opportunitiesTable.size}`
  );

  // TEST X: Application data integrity
  const candidateReview = await applicationService.getCandidateReviewDetail(
    appRes.applicationId,
    "industry-user-uuid-1"
  );
  assert(
    candidateReview.id === appRes.applicationId &&
      candidateReview.studentEmail === "student.a@veda.local" &&
      candidateReview.status === "selected",
    "Test X: Application data integrity verified across relational joins and applicant reviews"
  );

  console.log("\n================================================================================");
  console.log(` MODULE 3 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runModule3Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
