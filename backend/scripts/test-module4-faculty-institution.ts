import jwt from "jsonwebtoken";
import { institutionService } from "../src/services/institution.service";
import { facultyService } from "../src/services/faculty.service";
import { profileService } from "../src/services/profile.service";
import { requireAuth, requireRole } from "../src/middleware/auth.middleware";
import * as dbModule from "../src/db";

async function runModule4Tests() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 4: FACULTY + INSTITUTION CORE TEST SUITE");
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
  // Hermetic In-Memory Database Simulator for Module 4
  // ---------------------------------------------------------------------------

  // 1. Institutions Table (from Module 2)
  const institutionsTable = [
    {
      id: "inst-uuid-1",
      name: "All India Institute of Ayurveda (AIIA)",
      code: "AIIA-DEL",
      category: "National Institute",
      location: "New Delhi, Delhi",
      verification_status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "inst-uuid-2",
      name: "National Institute of Ayurveda (NIA)",
      code: "NIA-JAI",
      category: "National Institute",
      location: "Jaipur, Rajasthan",
      verification_status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "inst-uuid-pending",
      name: "Unverified Private College",
      code: "UPC-LKO",
      category: "Private College",
      location: "Lucknow, UP",
      verification_status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  // 2. Users Table (Module 1 Identity: canonical email and role)
  const usersTable = new Map<string, {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>();

  // Initial users
  usersTable.set("inst-admin-1", {
    id: "inst-admin-1",
    email: "admin@aiia.edu.in",
    password_hash: "hash_admin1",
    role: "institution",
    created_at: new Date().toISOString(),
  });
  usersTable.set("inst-admin-2", {
    id: "inst-admin-2",
    email: "admin@nia.edu.in",
    password_hash: "hash_admin2",
    role: "institution",
    created_at: new Date().toISOString(),
  });
  usersTable.set("faculty-user-1", {
    id: "faculty-user-1",
    email: "prof.sharma@aiia.edu.in",
    password_hash: "hash_faculty1",
    role: "faculty",
    created_at: new Date().toISOString(),
  });
  usersTable.set("faculty-user-2", {
    id: "faculty-user-2",
    email: "dr.verma@nia.edu.in",
    password_hash: "hash_faculty2",
    role: "faculty",
    created_at: new Date().toISOString(),
  });
  usersTable.set("student-user-1", {
    id: "student-user-1",
    email: "aarav.patel@student.aiia.edu.in",
    password_hash: "hash_student1",
    role: "student",
    created_at: new Date().toISOString(),
  });
  usersTable.set("student-user-2", {
    id: "student-user-2",
    email: "diya.sharma@student.nia.edu.in",
    password_hash: "hash_student2",
    role: "student",
    created_at: new Date().toISOString(),
  });
  usersTable.set("industry-user-1", {
    id: "industry-user-1",
    email: "recruiter@dabur.local",
    password_hash: "hash_industry1",
    role: "industry",
    created_at: new Date().toISOString(),
  });

  // 3. Profiles Table (Module 4 Schema: id = users.id, no role or email columns)
  const profilesTable = new Map<string, {
    id: string;
    full_name: string;
    phone?: string | null;
    institution_id: string | null;
    program?: string | null;
    year?: number | null;
    department?: string | null;
    designation?: string | null;
    avatar_url?: string | null;
    created_at: string;
    updated_at: string;
  }>();

  profilesTable.set("inst-admin-1", {
    id: "inst-admin-1",
    full_name: "AIIA Administrator",
    institution_id: "inst-uuid-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  profilesTable.set("inst-admin-2", {
    id: "inst-admin-2",
    full_name: "NIA Administrator",
    institution_id: "inst-uuid-2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  profilesTable.set("faculty-user-1", {
    id: "faculty-user-1",
    full_name: "Prof. Rajesh Sharma",
    institution_id: "inst-uuid-1",
    department: "Kayachikitsa (Internal Medicine)",
    designation: "Professor & HOD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  profilesTable.set("faculty-user-2", {
    id: "faculty-user-2",
    full_name: "Dr. Sunita Verma",
    institution_id: "inst-uuid-2",
    department: "Dravyaguna Vijnana",
    designation: "Associate Professor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  profilesTable.set("student-user-1", {
    id: "student-user-1",
    full_name: "Aarav Patel",
    institution_id: "inst-uuid-1",
    program: "BAMS",
    year: 4,
    department: "Clinical Ayurveda",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  profilesTable.set("student-user-2", {
    id: "student-user-2",
    full_name: "Diya Sharma",
    institution_id: "inst-uuid-2",
    program: "BAMS",
    year: 3,
    department: "Dravyaguna",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  profilesTable.set("industry-user-1", {
    id: "industry-user-1",
    full_name: "Dabur Recruiter",
    institution_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 4. Competency Scores Table
  const studentCompetenciesTable = [
    { student_id: "student-user-1", competency_id: "comp-1", proficiency_score: 85, last_assessed_at: new Date().toISOString(), source: "Self Assessment", verified: true, name: "Ayurvedic Foundational Understanding", category: "academic_domain", description: "Foundations" },
    { student_id: "student-user-1", competency_id: "comp-2", proficiency_score: 95, last_assessed_at: new Date().toISOString(), source: "Clinical OSCE", verified: true, name: "Clinical History and Examination", category: "clinical_practical", description: "Clinical" },
    { student_id: "student-user-2", competency_id: "comp-1", proficiency_score: 70, last_assessed_at: new Date().toISOString(), source: "Self Assessment", verified: false, name: "Ayurvedic Foundational Understanding", category: "academic_domain", description: "Foundations" },
  ];

  // 5. Applications Table
  const applicationsTable = [
    { id: "app-1", student_id: "student-user-1", status: "applied" },
    { id: "app-2", student_id: "student-user-1", status: "shortlisted" },
    { id: "app-3", student_id: "student-user-2", status: "under_review" },
  ];

  // Mock DB query implementation
  const mockQueryFn = async (sql: string, params?: any[]) => {
    const text = sql.trim();

    // 1. Get profile + user join
    if (text.includes("FROM public.users u") && text.includes("LEFT JOIN public.profiles p ON u.id = p.id")) {
      const uid = params?.[0];
      const u = usersTable.get(uid);
      if (!u) return { rows: [] };
      const p = profilesTable.get(uid);
      const inst = institutionsTable.find((i) => i.id === p?.institution_id);
      return {
        rows: [
          {
            id: u.id,
            email: u.email,
            role: u.role,
            user_created_at: u.created_at,
            full_name: p?.full_name || "",
            phone: p?.phone || null,
            institution_id: p?.institution_id || null,
            program: p?.program || null,
            year: p?.year || null,
            department: p?.department || null,
            designation: p?.designation || null,
            avatar_url: p?.avatar_url || null,
            created_at: p?.created_at || u.created_at,
            updated_at: p?.updated_at || u.created_at,
            institution_name: inst?.name || null,
          },
        ],
      };
    }

    // 2. Fetch institution verification status
    if (text.includes("FROM public.institutions") && text.includes("WHERE id = $1")) {
      const iid = params?.[0];
      const inst = institutionsTable.find((i) => i.id === iid);
      return { rows: inst ? [inst] : [] };
    }

    // 3. SELECT institution_id FROM public.profiles WHERE id = $1
    if (text.includes("SELECT institution_id FROM public.profiles WHERE id = $1")) {
      const uid = params?.[0];
      const p = profilesTable.get(uid);
      return { rows: p ? [{ institution_id: p.institution_id }] : [] };
    }

    // 4. SELECT id, institution_id FROM public.profiles WHERE id = $1
    if (text.includes("SELECT id, institution_id FROM public.profiles WHERE id = $1")) {
      const uid = params?.[0];
      const p = profilesTable.get(uid);
      return { rows: p ? [{ id: p.id, institution_id: p.institution_id }] : [] };
    }

    // 5. UPDATE public.profiles SET
    if (text.startsWith("UPDATE public.profiles SET")) {
      const uid = params?.[params.length - 1];
      const p = profilesTable.get(uid);
      if (p) {
        if (text.includes("institution_id =")) {
          // find param for institution_id
          const instMatch = text.match(/institution_id = \$(\d+)/);
          if (instMatch) {
            const idx = parseInt(instMatch[1], 10) - 1;
            p.institution_id = params?.[idx] ?? null;
          }
        }
        if (text.includes("full_name =")) {
          const fnMatch = text.match(/full_name = \$(\d+)/);
          if (fnMatch) {
            const idx = parseInt(fnMatch[1], 10) - 1;
            p.full_name = params?.[idx];
          }
        }
        p.updated_at = new Date().toISOString();
        profilesTable.set(uid, p);
      }
      return { rows: [] };
    }

    // 6. Faculty in institution (count or list)
    if (text.includes("WHERE p.institution_id = $1 AND u.role = 'faculty'")) {
      const iid = params?.[0];
      const facultyList = Array.from(profilesTable.values())
        .filter((p) => p.institution_id === iid && usersTable.get(p.id)?.role === "faculty");

      if (text.includes("COUNT(p.id)")) {
        return { rows: [{ count: facultyList.length }] };
      }

      const rows = facultyList.map((p) => {
        const u = usersTable.get(p.id)!;
        return {
          id: p.id,
          full_name: p.full_name,
          email: u.email,
          department: p.department || null,
          designation: p.designation || null,
          created_at: p.created_at,
        };
      });
      return { rows };
    }

    // 7. Student list in institution: WHERE p.institution_id = $1 AND u.role = 'student'
    if (text.includes("WHERE p.institution_id = $1 AND u.role = 'student'")) {
      const iid = params?.[0];
      const rows = Array.from(profilesTable.values())
        .filter((p) => p.institution_id === iid && usersTable.get(p.id)?.role === "student")
        .map((p) => {
          const u = usersTable.get(p.id)!;
          const sComps = studentCompetenciesTable.filter((sc) => sc.student_id === p.id);
          const avg = sComps.length > 0 ? sComps.reduce((acc, c) => acc + c.proficiency_score, 0) / sComps.length : null;
          return {
            id: p.id,
            full_name: p.full_name,
            email: u.email,
            program: p.program || null,
            year: p.year || null,
            department: p.department || null,
            created_at: p.created_at,
            comps_count: sComps.length,
            avg_score: avg,
          };
        });
      return { rows };
    }

    // 8. Single student audit: WHERE p.id = $1 AND u.role = 'student'
    if (text.includes("WHERE p.id = $1 AND u.role = 'student'")) {
      const sid = params?.[0];
      const p = profilesTable.get(sid);
      const u = usersTable.get(sid);
      if (!p || !u || u.role !== "student") return { rows: [] };
      const inst = institutionsTable.find((i) => i.id === p.institution_id);
      return {
        rows: [
          {
            id: p.id,
            full_name: p.full_name,
            email: u.email,
            program: p.program || null,
            year: p.year || null,
            department: p.department || null,
            institution_id: p.institution_id || null,
            created_at: p.created_at,
            institution_name: inst?.name || null,
            institution_code: inst?.code || null,
          },
        ],
      };
    }

    // 9. Student competencies list: WHERE sc.student_id = $1
    if (text.includes("FROM public.student_competencies sc") && text.includes("WHERE sc.student_id = $1")) {
      const sid = params?.[0];
      const comps = studentCompetenciesTable.filter((sc) => sc.student_id === sid);
      return { rows: comps };
    }

    // 10. Cohort competency averages: WHERE student_id = ANY($1::uuid[])
    if (text.includes("FROM public.student_competencies") && text.includes("WHERE student_id = ANY")) {
      const sids: string[] = params?.[0] || [];
      const comps = studentCompetenciesTable.filter((sc) => sids.includes(sc.student_id));
      const byStudent = new Map<string, number[]>();
      for (const c of comps) {
        let arr = byStudent.get(c.student_id) || [];
        arr.push(c.proficiency_score);
        byStudent.set(c.student_id, arr);
      }
      const rows = Array.from(byStudent.entries()).map(([sid, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          student_id: sid,
          student_avg: avg,
          avg_score: avg,
        };
      });
      return { rows };
    }

    // 11. Application stats: WHERE student_id = ANY($1::uuid[]) or student_id = $1
    if (text.includes("FROM public.applications") && text.includes("GROUP BY status")) {
      let apps = applicationsTable;
      if (text.includes("WHERE student_id = ANY")) {
        const sids: string[] = params?.[0] || [];
        apps = applicationsTable.filter((a) => sids.includes(a.student_id));
      } else if (text.includes("WHERE student_id = $1")) {
        const sid = params?.[0];
        apps = applicationsTable.filter((a) => a.student_id === sid);
      }
      const counts: Record<string, number> = {};
      for (const a of apps) {
        counts[a.status] = (counts[a.status] || 0) + 1;
      }
      return {
        rows: Object.entries(counts).map(([status, count]) => ({ status, count })),
      };
    }

    // 12. Check duplicate email in public.users: SELECT id FROM public.users WHERE email = $1
    if (text.includes("SELECT id FROM public.users WHERE email = $1")) {
      const email = params?.[0];
      const match = Array.from(usersTable.values()).find((u) => u.email === email);
      return { rows: match ? [{ id: match.id }] : [] };
    }

    // 13. Faculty affiliation lookup: WHERE p.id = $1 AND u.role = 'faculty'
    if (text.includes("WHERE p.id = $1 AND u.role = 'faculty'")) {
      const fid = params?.[0];
      const p = profilesTable.get(fid);
      const u = usersTable.get(fid);
      if (!p || !u || u.role !== "faculty") return { rows: [] };
      const inst = institutionsTable.find((i) => i.id === p.institution_id);
      return {
        rows: [
          {
            id: p.id,
            full_name: p.full_name,
            email: u.email,
            department: p.department || null,
            designation: p.designation || null,
            institution_id: p.institution_id || null,
            institution_name: inst?.name || null,
            institution_code: inst?.code || null,
            institution_location: inst?.location || null,
          },
        ],
      };
    }

    // 14. Analytics category breakdown: FROM public.student_competencies sc JOIN public.competencies c
    if (text.includes("FROM public.student_competencies sc") && text.includes("JOIN public.competencies c") && text.includes("GROUP BY c.id")) {
      const sids: string[] = params?.[0] || [];
      const comps = studentCompetenciesTable.filter((sc) => sids.includes(sc.student_id));
      const map = new Map<string, any>();
      for (const c of comps) {
        let entry = map.get(c.competency_id);
        if (!entry) {
          entry = { id: c.competency_id, name: c.name, category: c.category, scores: [] };
          map.set(c.competency_id, entry);
        }
        entry.scores.push(c.proficiency_score);
      }
      const rows = Array.from(map.values()).map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        avg_score: e.scores.reduce((a: number, b: number) => a + b, 0) / e.scores.length,
      }));
      return { rows };
    }

    return { rows: [] };
  };

  // Transaction simulation for faculty provisioning
  let shouldSimulateRollback = false;

  const mockConnectFn = async () => {
    const snapshotUsers = new Map(Array.from(usersTable.entries()).map(([k, v]) => [k, { ...v }]));
    const snapshotProfiles = new Map(Array.from(profilesTable.entries()).map(([k, v]) => [k, { ...v }]));

    return {
      query: async (sql: string, params?: any[]) => {
        const text = sql.trim();

        if (text === "BEGIN") return { rows: [] };
        if (text === "COMMIT") {
          if (shouldSimulateRollback) {
            throw new Error("Simulated provisioning transaction failure");
          }
          return { rows: [] };
        }
        if (text === "ROLLBACK") {
          usersTable.clear();
          for (const [k, v] of snapshotUsers.entries()) usersTable.set(k, v);
          profilesTable.clear();
          for (const [k, v] of snapshotProfiles.entries()) profilesTable.set(k, v);
          return { rows: [] };
        }

        // Insert User: INSERT INTO public.users (email, password_hash, role) VALUES ($1, $2, 'faculty')
        if (text.includes("INSERT INTO public.users")) {
          const email = params?.[0];
          const hash = params?.[1];
          const role = params?.[2] || "faculty";
          const id = `faculty-user-${Date.now()}`;
          usersTable.set(id, { id, email, password_hash: hash, role, created_at: new Date().toISOString() });
          return { rows: [{ id }] };
        }

        // Insert Profile: INSERT INTO public.profiles (id, full_name, department, designation, institution_id)
        if (text.includes("INSERT INTO public.profiles")) {
          const id = params?.[0];
          const full_name = params?.[1];
          const department = params?.[2];
          const designation = params?.[3];
          const institution_id = params?.[4];
          profilesTable.set(id, {
            id,
            full_name,
            department,
            designation,
            institution_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return { rows: [] };
        }

        return { rows: [] };
      },
      release: () => {},
    };
  };

  // Monkey-patch db module
  (dbModule.db as any).query = mockQueryFn;
  (dbModule.pool as any).query = mockQueryFn;
  (dbModule.pool as any).connect = mockConnectFn;

  // ===========================================================================
  // TEST SUITE EXECUTION
  // ===========================================================================

  console.log("--- 1. Authentication & Role Boundary Tests ---");

  // TEST A: Unauthenticated request returns 401
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
  assert(unauthBlocked, "Test A: Unauthenticated request returns 401 Unauthorized");

  // TEST B: Student accessing faculty endpoint returns 403
  let studentFacultyBlocked = false;
  const mockReqStudent: any = { user: { userId: "student-user-1", role: "student" } };
  const mockResStudent: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 403) studentFacultyBlocked = true;
      },
    }),
  };
  requireRole("faculty")(mockReqStudent, mockResStudent, () => {});
  assert(studentFacultyBlocked, "Test B: Student role blocked from faculty endpoint with 403 Forbidden");

  // TEST C: Faculty accessing institution administrator endpoint returns 403
  let facultyInstBlocked = false;
  const mockReqFaculty: any = { user: { userId: "faculty-user-1", role: "faculty" } };
  const mockResFaculty: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 403) facultyInstBlocked = true;
      },
    }),
  };
  requireRole("institution")(mockReqFaculty, mockResFaculty, () => {});
  assert(facultyInstBlocked, "Test C: Faculty role blocked from institution administrator endpoint with 403 Forbidden");

  // TEST D: Industry accessing faculty/institution endpoints returns 403
  let industryBlocked = false;
  const mockReqIndustry: any = { user: { userId: "industry-user-1", role: "industry" } };
  const mockResIndustry: any = {
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 403) industryBlocked = true;
      },
    }),
  };
  requireRole("faculty")(mockReqIndustry, mockResIndustry, () => {});
  assert(industryBlocked, "Test D: Industry role blocked from academic faculty endpoint with 403 Forbidden");

  console.log("\n--- 2. Profile Service & Institution Affiliation Security ---");

  // TEST E: Profile retrieval strictly joins users for canonical role and email
  const profileRes = await profileService.getProfile("student-user-1");
  assert(
    profileRes.role === "student" && profileRes.email === "aarav.patel@student.aiia.edu.in",
    "Test E: Profile retrieval strictly reads canonical role and email from public.users",
    `Role: ${profileRes.role}, Email: ${profileRes.email}`
  );

  // TEST F: Student can update affiliation to an approved institution
  const updatedStudentProfile = await profileService.updateProfile("student-user-1", "student", {
    institutionId: "inst-uuid-2", // NIA (approved)
  });
  assert(
    updatedStudentProfile.institutionId === "inst-uuid-2",
    "Test F: Student can update affiliation to a verified approved institution"
  );
  // Revert for subsequent multi-tenant tests
  await profileService.updateProfile("student-user-1", "student", { institutionId: "inst-uuid-1" });

  // TEST G: Student CANNOT update affiliation to an unverified/pending institution
  let pendingInstRejected = false;
  try {
    await profileService.updateProfile("student-user-1", "student", {
      institutionId: "inst-uuid-pending",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("not approved")) pendingInstRejected = true;
  }
  assert(pendingInstRejected, "Test G: Student cannot affiliate with unapproved/pending institution (400 Bad Request)");

  // TEST H: Faculty CANNOT change institution affiliation via profile update endpoint
  let facultyAffiliationBlocked = false;
  try {
    await profileService.updateProfile("faculty-user-1", "faculty", {
      institutionId: "inst-uuid-2",
    });
  } catch (err: any) {
    if (err.statusCode === 403) facultyAffiliationBlocked = true;
  }
  assert(facultyAffiliationBlocked, "Test H: Non-student accounts strictly blocked from modifying institution_id (403 Forbidden)");

  console.log("\n--- 3. Multi-Tenant Institution Isolation Tests ---");

  // TEST I: Faculty from Institution A cannot view Institution B student details
  let crossInstFacultyBlocked = false;
  try {
    // Faculty 1 belongs to AIIA (inst-uuid-1), student 2 belongs to NIA (inst-uuid-2)
    await facultyService.getStudentDetail("faculty-user-1", "student-user-2");
  } catch (err: any) {
    if (err.statusCode === 403) crossInstFacultyBlocked = true;
  }
  assert(crossInstFacultyBlocked, "Test I: Faculty A cannot access Institution B student details (403 Forbidden)");

  // TEST J: Faculty from Institution A can view Institution A student details
  const facultyStudentDetail = await facultyService.getStudentDetail("faculty-user-1", "student-user-1");
  assert(
    facultyStudentDetail.student.id === "student-user-1" && facultyStudentDetail.competencies.length === 2,
    "Test J: Faculty A can access cohort students belonging to Institution A",
    `Student: ${facultyStudentDetail.student.fullName}, Comps: ${facultyStudentDetail.competencies.length}`
  );

  // TEST K: Institution Admin A cannot view Institution B student details
  let crossInstAdminBlocked = false;
  try {
    // Admin 1 belongs to AIIA, student 2 belongs to NIA
    await institutionService.getStudentDetail("inst-admin-1", "student-user-2");
  } catch (err: any) {
    if (err.statusCode === 403) crossInstAdminBlocked = true;
  }
  assert(crossInstAdminBlocked, "Test K: Institution Admin A cannot access Institution B student (403 Forbidden)");

  // TEST L: Institution Admin A cannot view Institution B faculty
  const inst1FacultyRoster = await institutionService.getFacultyDirectory("inst-admin-1");
  const includesOtherFaculty = inst1FacultyRoster.some((f) => f.id === "faculty-user-2");
  assert(!includesOtherFaculty, "Test L: Institution Admin A directory strictly excludes faculty from Institution B");

  console.log("\n--- 4. Faculty & Institution Dashboards & Analytics ---");

  // TEST M: Faculty Dashboard reflects accurate cohort metrics
  const facultyDash = await facultyService.getDashboard("faculty-user-1");
  assert(
    facultyDash.metrics.cohortStudentCount === 1 && facultyDash.metrics.assessedStudentsCount === 1,
    "Test M: Faculty dashboard retrieves verified cohort student count and assessed metrics",
    `Cohort: ${facultyDash.metrics.cohortStudentCount}, Assessed: ${facultyDash.metrics.assessedStudentsCount}, Avg: ${facultyDash.metrics.averageCohortScore}%`
  );

  // TEST N: Institution Dashboard reflects accurate institutional metrics & privacy-preserved application stats
  const instDash = await institutionService.getDashboard("inst-admin-1");
  assert(
    instDash.metrics.totalStudents === 1 &&
      instDash.metrics.totalFaculty === 1 &&
      instDash.applicationStats.total === 2 &&
      instDash.applicationStats.applied === 1 &&
      instDash.applicationStats.shortlisted === 1,
    "Test N: Institution dashboard returns aggregated student/faculty counts and privacy-preserving application stats",
    `Total students: ${instDash.metrics.totalStudents}, Total applications: ${instDash.applicationStats.total}`
  );

  // TEST O: Institution Analytics returns category averages
  const instAnalytics = await institutionService.getAnalytics("inst-admin-1");
  assert(
    instAnalytics.totalStudents === 1 && Boolean(instAnalytics.categoryAverages["academic_domain"]),
    "Test O: Institution analytics calculates cohort competency category benchmarks accurately"
  );

  console.log("\n--- 5. Atomic Faculty Account Provisioning ---");

  // TEST P: Institution Admin provisions new faculty account in atomic transaction
  const provisionResult = await institutionService.provisionFaculty("inst-admin-1", {
    fullName: "Dr. Ananya Joshi",
    email: "ananya.joshi@aiia.edu.in",
    department: "Panchakarma (Bio-Purification Therapy)",
    designation: "Assistant Professor",
    temporaryPassword: "TempPassword123!",
  });

  assert(
    Boolean(provisionResult.facultyId) && provisionResult.email === "ananya.joshi@aiia.edu.in",
    "Test P: Institution Admin can provision new faculty account atomically",
    `Created faculty ID: ${provisionResult.facultyId}`
  );

  // Verify created faculty account role in users and institution_id in profiles
  const createdUser = usersTable.get(provisionResult.facultyId);
  const createdProfile = profilesTable.get(provisionResult.facultyId);

  assert(
    createdUser?.role === "faculty" && createdProfile?.institution_id === "inst-uuid-1",
    "Test P.1: Provisioned faculty account has users.role = 'faculty' and caller's institution_id",
    `Role: ${createdUser?.role}, Institution: ${createdProfile?.institution_id}`
  );

  // TEST Q: Free-text designation is preserved
  assert(
    createdProfile?.designation === "Assistant Professor",
    "Test Q: Free-text designation is accurately stored without artificial constraint distortion"
  );

  // TEST R: Duplicate faculty email is rejected with 409 Conflict
  let duplicateFacultyRejected = false;
  try {
    await institutionService.provisionFaculty("inst-admin-1", {
      fullName: "Duplicate Email Test",
      email: "ananya.joshi@aiia.edu.in",
      department: "Shalya Tantra",
      designation: "Lecturer",
      temporaryPassword: "TempPassword123!",
    });
  } catch (err: any) {
    if (err.statusCode === 409) duplicateFacultyRejected = true;
  }
  assert(duplicateFacultyRejected, "Test R: Duplicate faculty email rejected with 409 Conflict");

  // TEST S: Provisioning transaction rolls back cleanly on error (0 orphan records)
  shouldSimulateRollback = true;
  const userCountBefore = usersTable.size;
  const profileCountBefore = profilesTable.size;

  let rollbackSucceeded = false;
  try {
    await institutionService.provisionFaculty("inst-admin-1", {
      fullName: "Failing Transaction Faculty",
      email: "failing.faculty@aiia.edu.in",
      department: "Samhita",
      designation: "Dean",
      temporaryPassword: "TempPassword123!",
    });
  } catch (err) {
    rollbackSucceeded = usersTable.size === userCountBefore && profilesTable.size === profileCountBefore;
  }
  shouldSimulateRollback = false;

  assert(
    rollbackSucceeded,
    "Test S: Transaction failure cleanly rolls back state leaving 0 orphan user or profile records",
    `Users before/after: ${userCountBefore}/${usersTable.size}, Profiles: ${profileCountBefore}/${profilesTable.size}`
  );

  console.log("\n================================================================================");
  console.log(` MODULE 4 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runModule4Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
