import jwt from "jsonwebtoken";
import { mentorshipService } from "../src/services/mentorship.service";
import { facultyCollaborationService } from "../src/services/collaboration.service";
import { requireAuth, requireRole } from "../src/middleware/auth.middleware";
import * as dbModule from "../src/db";

async function runModule5Tests() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 5: STUDENT MENTORSHIP & FACULTY COLLABORATION TEST SUITE");
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
  // Hermetic In-Memory Database Simulator for Module 5
  // ---------------------------------------------------------------------------

  // 1. Institutions Table (Module 2)
  const institutionsTable = [
    { id: "inst-uuid-1", name: "All India Institute of Ayurveda (AIIA)", code: "AIIA-DEL" },
    { id: "inst-uuid-2", name: "National Institute of Ayurveda (NIA)", code: "NIA-JAI" },
  ];

  // 2. Organizations Table (Module 2)
  const organizationsTable = [
    { id: "org-uuid-1", name: "Dabur Research Foundation" },
  ];

  // 3. Users Table (Module 1: Canonical Email & Role)
  const usersTable = new Map<string, {
    id: string;
    email: string;
    role: string;
  }>();

  usersTable.set("student-user-1", { id: "student-user-1", email: "aarav@aiia.edu.in", role: "student" });
  usersTable.set("student-user-2", { id: "student-user-2", email: "diya@nia.edu.in", role: "student" });
  usersTable.set("student-user-unaffiliated", { id: "student-user-unaffiliated", email: "guest@student.local", role: "student" });

  usersTable.set("faculty-user-1", { id: "faculty-user-1", email: "prof.sharma@aiia.edu.in", role: "faculty" });
  usersTable.set("faculty-user-2", { id: "faculty-user-2", email: "dr.joshi@aiia.edu.in", role: "faculty" });
  usersTable.set("faculty-user-3", { id: "faculty-user-3", email: "dr.verma@nia.edu.in", role: "faculty" });

  usersTable.set("inst-admin-1", { id: "inst-admin-1", email: "admin@aiia.edu.in", role: "institution" });
  usersTable.set("industry-user-1", { id: "industry-user-1", email: "recruiter@dabur.local", role: "industry" });

  // 4. Profiles Table (Module 4: id = users.id, institution_id)
  const profilesTable = new Map<string, {
    id: string;
    full_name: string;
    institution_id: string | null;
    program?: string | null;
    year?: number | null;
    department?: string | null;
    designation?: string | null;
  }>();

  profilesTable.set("student-user-1", { id: "student-user-1", full_name: "Aarav Patel", institution_id: "inst-uuid-1", program: "BAMS", year: 4, department: "Clinical" });
  profilesTable.set("student-user-2", { id: "student-user-2", full_name: "Diya Sharma", institution_id: "inst-uuid-2", program: "BAMS", year: 3, department: "Panchakarma" });
  profilesTable.set("student-user-unaffiliated", { id: "student-user-unaffiliated", full_name: "Guest Scholar", institution_id: null });

  profilesTable.set("faculty-user-1", { id: "faculty-user-1", full_name: "Prof. Rajesh Sharma", institution_id: "inst-uuid-1", department: "Kayachikitsa", designation: "Professor" });
  profilesTable.set("faculty-user-2", { id: "faculty-user-2", full_name: "Dr. Ananya Joshi", institution_id: "inst-uuid-1", department: "Panchakarma", designation: "Assistant Professor" });
  profilesTable.set("faculty-user-3", { id: "faculty-user-3", full_name: "Dr. Sunita Verma", institution_id: "inst-uuid-2", department: "Dravyaguna", designation: "Associate Professor" });

  profilesTable.set("inst-admin-1", { id: "inst-admin-1", full_name: "AIIA Administrator", institution_id: "inst-uuid-1" });
  profilesTable.set("industry-user-1", { id: "industry-user-1", full_name: "Dabur Recruiter", institution_id: null });

  // 5. Student Competencies (Module 2)
  const studentCompetenciesTable = [
    { student_id: "student-user-1", proficiency_score: 85 },
    { student_id: "student-user-1", proficiency_score: 45 }, // 1 priority area (<60)
  ];

  // 6. Mentorships Table (Module 5)
  const mentorshipsTable = new Map<string, {
    id: string;
    faculty_id: string;
    student_id: string;
    requested_by: string | null;
    status: "pending" | "active" | "completed" | "rejected";
    request_note: string | null;
    mentor_note: string | null;
    created_at: string;
    updated_at: string;
  }>();

  // 7. Faculty Opportunities Table (Module 5)
  const facultyOpportunitiesTable = new Map<string, {
    id: string;
    organization_id: string | null;
    created_by: string | null;
    title: string;
    description: string;
    opportunity_type: string;
    provider_name: string | null;
    location: string | null;
    mode: string | null;
    start_date: string | null;
    end_date: string | null;
    application_deadline: string | null;
    external_url: string | null;
    status: "draft" | "published" | "closed" | "archived";
    created_at: string;
    updated_at: string;
  }>();

  // Seed one initial published opportunity
  facultyOpportunitiesTable.set("opp-init-1", {
    id: "opp-init-1",
    organization_id: null,
    created_by: "faculty-user-1",
    title: "National Ayurveda FDP on Panchakarma Bio-Purification",
    description: "Intensive 7-day residential faculty development program on advanced clinical therapeutics.",
    opportunity_type: "fdp",
    provider_name: "All India Institute of Ayurveda",
    location: "New Delhi",
    mode: "onsite",
    start_date: "2026-11-01",
    end_date: "2026-11-07",
    application_deadline: "2026-10-15",
    external_url: "https://aiia.gov.in/fdp-2026",
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 8. Faculty Opportunity Interests Table (Module 5)
  const facultyInterestsTable = new Map<string, {
    id: string;
    opportunity_id: string;
    faculty_id: string;
    message: string | null;
    status: "interested" | "under_review" | "accepted" | "rejected" | "withdrawn";
    created_at: string;
    updated_at: string;
  }>();

  // Mock DB Query Function
  const mockQueryFn = async (sql: string, params?: any[]) => {
    const text = sql.trim();

    // User + Profile lookup
    if (text.includes("FROM public.profiles p") && text.includes("JOIN public.users u ON p.id = u.id") && text.includes("WHERE p.id = $1")) {
      const uid = params?.[0];
      const p = profilesTable.get(uid);
      const u = usersTable.get(uid);
      if (!p || !u) return { rows: [] };
      return {
        rows: [{
          id: p.id,
          full_name: p.full_name,
          role: u.role,
          institution_id: p.institution_id,
        }],
      };
    }

    // Institution lookup by id
    if (text.includes("FROM public.institutions") && text.includes("WHERE id = $1")) {
      const iid = params?.[0];
      const inst = institutionsTable.find((i) => i.id === iid);
      return { rows: inst ? [inst] : [] };
    }

    // Available faculty in institution
    if (text.includes("WHERE p.institution_id = $1 AND u.role = 'faculty'")) {
      const iid = params?.[0];
      const rows = Array.from(profilesTable.values())
        .filter((p) => p.institution_id === iid && usersTable.get(p.id)?.role === "faculty")
        .map((p) => ({
          id: p.id,
          full_name: p.full_name,
          department: p.department || null,
          designation: p.designation || null,
        }));
      return { rows };
    }

    // Mentorships by student_id
    if (text.includes("FROM public.mentorships m") && text.includes("WHERE m.student_id = $1")) {
      const sid = params?.[0];
      const rows = Array.from(mentorshipsTable.values())
        .filter((m) => m.student_id === sid)
        .map((m) => {
          const fac = profilesTable.get(m.faculty_id);
          return {
            id: m.id,
            faculty_id: m.faculty_id,
            status: m.status,
            request_note: m.request_note,
            created_at: m.created_at,
            updated_at: m.updated_at,
            faculty_name: fac?.full_name || "Faculty Mentor",
            faculty_department: fac?.department || null,
          };
        });
      return { rows };
    }

    // Mentorships by faculty_id
    if (text.includes("FROM public.mentorships m") && text.includes("WHERE m.faculty_id = $1")) {
      const fid = params?.[0];
      const rows = Array.from(mentorshipsTable.values())
        .filter((m) => m.faculty_id === fid)
        .map((m) => {
          const st = profilesTable.get(m.student_id);
          return {
            id: m.id,
            student_id: m.student_id,
            status: m.status,
            request_note: m.request_note,
            mentor_note: m.mentor_note,
            created_at: m.created_at,
            updated_at: m.updated_at,
            student_name: st?.full_name || "Ayush Student",
            program: st?.program || null,
            year: st?.year || null,
            department: st?.department || null,
          };
        });
      return { rows };
    }

    // Student competencies lookup
    if (text.includes("FROM public.student_competencies") && text.includes("WHERE student_id = ANY")) {
      const sids: string[] = params?.[0] || [];
      const rows = studentCompetenciesTable.filter((sc) => sids.includes(sc.student_id));
      return { rows };
    }

    // Mentorship by id lookup
    if (text.includes("FROM public.mentorships") && text.includes("WHERE id = $1")) {
      const mid = params?.[0];
      const m = mentorshipsTable.get(mid);
      return { rows: m ? [m] : [] };
    }

    // Update mentorship note
    if (text.startsWith("UPDATE public.mentorships") && text.includes("SET mentor_note = $1")) {
      const note = params?.[0];
      const mid = params?.[1];
      const m = mentorshipsTable.get(mid);
      if (m) {
        m.mentor_note = note;
        m.updated_at = new Date().toISOString();
        mentorshipsTable.set(mid, m);
        return { rows: [{ id: m.id, mentor_note: m.mentor_note, updated_at: m.updated_at }] };
      }
      return { rows: [] };
    }

    // Complete mentorship
    if (text.startsWith("UPDATE public.mentorships") && text.includes("SET status = 'completed'")) {
      const mid = params?.[0];
      const m = mentorshipsTable.get(mid);
      if (m) {
        m.status = "completed";
        m.updated_at = new Date().toISOString();
        mentorshipsTable.set(mid, m);
        return { rows: [m] };
      }
      return { rows: [] };
    }

    // Opportunities: Discovery
    if (text.includes("FROM public.faculty_opportunities o") && text.includes("WHERE o.status = 'published'")) {
      const callerId = params?.[0];
      let rows = Array.from(facultyOpportunitiesTable.values())
        .filter((o) => o.status === "published");

      if (params?.[1]) {
        // filter opportunity_type
        rows = rows.filter((o) => o.opportunity_type === params[1]);
      }

      return {
        rows: rows.map((o) => {
          const interest = Array.from(facultyInterestsTable.values())
            .find((i) => i.opportunity_id === o.id && i.faculty_id === callerId);
          return {
            id: o.id,
            title: o.title,
            description: o.description,
            opportunity_type: o.opportunity_type,
            provider_name: o.provider_name,
            location: o.location,
            mode: o.mode,
            start_date: o.start_date,
            end_date: o.end_date,
            application_deadline: o.application_deadline,
            external_url: o.external_url,
            status: o.status,
            organization_id: o.organization_id,
            created_by: o.created_by,
            created_at: o.created_at,
            updated_at: o.updated_at,
            my_interest_status: interest?.status || null,
          };
        }),
      };
    }

    // Opportunities: Detail by ID
    if (text.includes("FROM public.faculty_opportunities o") && text.includes("WHERE o.id = $2")) {
      const callerId = params?.[0];
      const oid = params?.[1];
      const o = facultyOpportunitiesTable.get(oid);
      if (!o) return { rows: [] };
      const interest = Array.from(facultyInterestsTable.values())
        .find((i) => i.opportunity_id === o.id && i.faculty_id === callerId);

      return {
        rows: [{
          id: o.id,
          title: o.title,
          description: o.description,
          opportunity_type: o.opportunity_type,
          provider_name: o.provider_name,
          location: o.location,
          mode: o.mode,
          start_date: o.start_date,
          end_date: o.end_date,
          application_deadline: o.application_deadline,
          external_url: o.external_url,
          status: o.status,
          organization_id: o.organization_id,
          created_by: o.created_by,
          created_at: o.created_at,
          updated_at: o.updated_at,
          my_interest_id: interest?.id || null,
          my_interest_status: interest?.status || null,
          my_interest_message: interest?.message || null,
          my_interest_created_at: interest?.created_at || null,
        }],
      };
    }

    // Opportunity count of applicants
    if (text.includes("COUNT(*)::int AS count FROM public.faculty_opportunity_interests WHERE opportunity_id = $1")) {
      const oid = params?.[0];
      const count = Array.from(facultyInterestsTable.values()).filter((i) => i.opportunity_id === oid).length;
      return { rows: [{ count }] };
    }

    // My Authored Opportunities
    if (text.includes("FROM public.faculty_opportunities o") && text.includes("WHERE o.created_by = $1")) {
      const authorId = params?.[0];
      const rows = Array.from(facultyOpportunitiesTable.values())
        .filter((o) => o.created_by === authorId)
        .map((o) => {
          const appCount = Array.from(facultyInterestsTable.values()).filter((i) => i.opportunity_id === o.id).length;
          return {
            id: o.id,
            title: o.title,
            description: o.description,
            opportunity_type: o.opportunity_type,
            provider_name: o.provider_name,
            mode: o.mode,
            start_date: o.start_date,
            end_date: o.end_date,
            application_deadline: o.application_deadline,
            status: o.status,
            created_at: o.created_at,
            updated_at: o.updated_at,
            applicant_count: appCount,
          };
        });
      return { rows };
    }

    // Create Opportunity
    if (text.startsWith("INSERT INTO public.faculty_opportunities")) {
      const id = `opp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newOpp = {
        id,
        created_by: params?.[0],
        title: params?.[1],
        description: params?.[2],
        opportunity_type: params?.[3],
        provider_name: params?.[4],
        location: params?.[5],
        mode: params?.[6],
        start_date: params?.[7],
        end_date: params?.[8],
        application_deadline: params?.[9],
        external_url: params?.[10],
        status: params?.[11] || "draft",
        organization_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      facultyOpportunitiesTable.set(id, newOpp);
      return { rows: [newOpp] };
    }

    // Opportunity lookup for update
    if (text.includes("SELECT id, created_by, status FROM public.faculty_opportunities WHERE id = $1")) {
      const oid = params?.[0];
      const o = facultyOpportunitiesTable.get(oid);
      return { rows: o ? [{ id: o.id, created_by: o.created_by, status: o.status }] : [] };
    }

    // Update Opportunity Metadata
    if (text.startsWith("UPDATE public.faculty_opportunities") && text.includes("SET") && !text.includes("SET status = $1")) {
      const oid = params?.[params.length - 1];
      const o = facultyOpportunitiesTable.get(oid);
      if (o) {
        if (text.includes("title =")) {
          const match = text.match(/title = \$(\d+)/);
          if (match) o.title = params?.[parseInt(match[1]) - 1];
        }
        o.updated_at = new Date().toISOString();
        facultyOpportunitiesTable.set(oid, o);
        return { rows: [o] };
      }
      return { rows: [] };
    }

    // Update Opportunity Status
    if (text.startsWith("UPDATE public.faculty_opportunities") && text.includes("SET status = $1")) {
      const status = params?.[0];
      const oid = params?.[1];
      const o = facultyOpportunitiesTable.get(oid);
      if (o) {
        o.status = status;
        o.updated_at = new Date().toISOString();
        facultyOpportunitiesTable.set(oid, o);
        return { rows: [o] };
      }
      return { rows: [] };
    }

    // List My Interests
    if (text.includes("FROM public.faculty_opportunity_interests i") && text.includes("WHERE i.faculty_id = $1")) {
      const fid = params?.[0];
      const rows = Array.from(facultyInterestsTable.values())
        .filter((i) => i.faculty_id === fid)
        .map((i) => {
          const o = facultyOpportunitiesTable.get(i.opportunity_id)!;
          return {
            id: i.id,
            status: i.status,
            message: i.message,
            created_at: i.created_at,
            updated_at: i.updated_at,
            opportunity_id: o.id,
            title: o.title,
            opportunity_type: o.opportunity_type,
            provider_name: o.provider_name,
            location: o.location,
            mode: o.mode,
            start_date: o.start_date,
            end_date: o.end_date,
            application_deadline: o.application_deadline,
            opportunity_status: o.status,
          };
        });
      return { rows };
    }

    // Opportunity check before interest submission
    if (text.includes("SELECT id, status, title FROM public.faculty_opportunities WHERE id = $1")) {
      const oid = params?.[0];
      const o = facultyOpportunitiesTable.get(oid);
      return { rows: o ? [{ id: o.id, status: o.status, title: o.title }] : [] };
    }

    // Existing interest check
    if (text.includes("FROM public.faculty_opportunity_interests") && text.includes("opportunity_id = $1 AND faculty_id = $2")) {
      const oid = params?.[0];
      const fid = params?.[1];
      const match = Array.from(facultyInterestsTable.values())
        .find((i) => i.opportunity_id === oid && i.faculty_id === fid);
      return { rows: match ? [match] : [] };
    }

    // Express interest insert
    if (text.startsWith("INSERT INTO public.faculty_opportunity_interests")) {
      const id = `interest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newInterest = {
        id,
        opportunity_id: params?.[0],
        faculty_id: params?.[1],
        message: params?.[2],
        status: "interested" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      facultyInterestsTable.set(id, newInterest);
      return { rows: [newInterest] };
    }

    // Interest lookup for update/withdraw
    if (text.includes("SELECT id, faculty_id, status FROM public.faculty_opportunity_interests WHERE id = $1")) {
      const iid = params?.[0];
      const i = facultyInterestsTable.get(iid);
      return { rows: i ? [i] : [] };
    }

    // Update interest message
    if (text.startsWith("UPDATE public.faculty_opportunity_interests") && text.includes("SET message = $1")) {
      const msg = params?.[0];
      const iid = params?.[1];
      const i = facultyInterestsTable.get(iid);
      if (i) {
        i.message = msg;
        i.updated_at = new Date().toISOString();
        facultyInterestsTable.set(iid, i);
        return { rows: [i] };
      }
      return { rows: [] };
    }

    // Withdraw interest
    if (text.startsWith("UPDATE public.faculty_opportunity_interests") && text.includes("SET status = 'withdrawn'")) {
      const iid = params?.[0];
      const i = facultyInterestsTable.get(iid);
      if (i) {
        i.status = "withdrawn";
        i.updated_at = new Date().toISOString();
        facultyInterestsTable.set(iid, i);
        return { rows: [i] };
      }
      return { rows: [] };
    }

    // List Opportunity Applicants
    if (text.includes("SELECT id, created_by, title FROM public.faculty_opportunities WHERE id = $1")) {
      const oid = params?.[0];
      const o = facultyOpportunitiesTable.get(oid);
      return { rows: o ? [{ id: o.id, created_by: o.created_by, title: o.title }] : [] };
    }

    if (text.includes("FROM public.faculty_opportunity_interests i") && text.includes("WHERE i.opportunity_id = $1")) {
      const oid = params?.[0];
      const rows = Array.from(facultyInterestsTable.values())
        .filter((i) => i.opportunity_id === oid)
        .map((i) => {
          const fac = profilesTable.get(i.faculty_id);
          const u = usersTable.get(i.faculty_id);
          const inst = institutionsTable.find((inst) => inst.id === fac?.institution_id);
          return {
            id: i.id,
            status: i.status,
            message: i.message,
            created_at: i.created_at,
            updated_at: i.updated_at,
            faculty_id: i.faculty_id,
            faculty_name: fac?.full_name || "Faculty Applicant",
            faculty_email: u?.email || "",
            department: fac?.department || null,
            institution_name: inst?.name || null,
            institution_code: inst?.code || null,
          };
        });
      return { rows };
    }

    // Update Applicant Status check
    if (text.includes("SELECT i.id, i.status, i.opportunity_id, o.created_by")) {
      const iid = params?.[0];
      const i = facultyInterestsTable.get(iid);
      if (!i) return { rows: [] };
      const o = facultyOpportunitiesTable.get(i.opportunity_id);
      return {
        rows: [{
          id: i.id,
          status: i.status,
          opportunity_id: i.opportunity_id,
          created_by: o?.created_by || null,
        }],
      };
    }

    // Update applicant status
    if (text.startsWith("UPDATE public.faculty_opportunity_interests") && text.includes("SET status = $1")) {
      const status = params?.[0];
      const iid = params?.[1];
      const i = facultyInterestsTable.get(iid);
      if (i) {
        i.status = status;
        i.updated_at = new Date().toISOString();
        facultyInterestsTable.set(iid, i);
        return { rows: [i] };
      }
      return { rows: [] };
    }

    return { rows: [] };
  };

  // Transaction simulator supporting FOR UPDATE locking and rollback
  const lockedStudents = new Set<string>();

  const mockConnectFn = async () => {
    const snapshotMentorships = new Map(Array.from(mentorshipsTable.entries()).map(([k, v]) => [k, { ...v }]));
    let clientLockedStudent: string | null = null;

    return {
      query: async (sql: string, params?: any[]) => {
        const text = sql.trim();

        if (text === "BEGIN") return { rows: [] };
        if (text === "COMMIT") {
          if (clientLockedStudent) lockedStudents.delete(clientLockedStudent);
          return { rows: [] };
        }
        if (text === "ROLLBACK") {
          mentorshipsTable.clear();
          for (const [k, v] of snapshotMentorships.entries()) mentorshipsTable.set(k, v);
          if (clientLockedStudent) lockedStudents.delete(clientLockedStudent);
          return { rows: [] };
        }

        // Lock student profile
        if (text.includes("SELECT id FROM public.profiles WHERE id = $1 FOR UPDATE")) {
          const sid = params?.[0];
          if (lockedStudents.has(sid)) {
            throw new Error(`Concurrency Conflict: student profile ${sid} is locked by another transaction`);
          }
          lockedStudents.add(sid);
          clientLockedStudent = sid;
          return { rows: [{ id: sid }] };
        }

        // Check active mentorship
        if (text.includes("SELECT id FROM public.mentorships") && text.includes("WHERE student_id = $1 AND status = 'active'")) {
          const sid = params?.[0];
          const exceptId = params?.[1];
          const active = Array.from(mentorshipsTable.values()).filter(
            (m) => m.student_id === sid && m.status === "active" && (!exceptId || m.id !== exceptId)
          );
          return { rows: active };
        }

        // Check pair mentorship
        if (text.includes("SELECT id, status FROM public.mentorships") && text.includes("WHERE student_id = $1 AND faculty_id = $2")) {
          const sid = params?.[0];
          const fid = params?.[1];
          const pair = Array.from(mentorshipsTable.values()).filter(
            (m) => m.student_id === sid && m.faculty_id === fid && ["pending", "active"].includes(m.status)
          );
          return { rows: pair };
        }

        if (text.includes("SELECT id, status FROM public.mentorships") && text.includes("WHERE faculty_id = $1 AND student_id = $2")) {
          const fid = params?.[0];
          const sid = params?.[1];
          const pair = Array.from(mentorshipsTable.values()).filter(
            (m) => m.faculty_id === fid && m.student_id === sid && ["pending", "active"].includes(m.status)
          );
          return { rows: pair };
        }

        // Student request insert
        if (text.startsWith("INSERT INTO public.mentorships") && text.includes("'pending'")) {
          const mid = `mentorship-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newM = {
            id: mid,
            student_id: params?.[0],
            faculty_id: params?.[1],
            requested_by: params?.[0],
            status: "pending" as const,
            request_note: params?.[2],
            mentor_note: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mentorshipsTable.set(mid, newM);
          return { rows: [newM] };
        }

        // Faculty initiate insert
        if (text.startsWith("INSERT INTO public.mentorships") && text.includes("'active'")) {
          const mid = `mentorship-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newM = {
            id: mid,
            faculty_id: params?.[0],
            student_id: params?.[1],
            requested_by: params?.[0],
            status: "active" as const,
            request_note: null,
            mentor_note: params?.[2],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mentorshipsTable.set(mid, newM);
          return { rows: [newM] };
        }

        // Accept request: fetch for update
        if (text.includes("SELECT id, faculty_id, student_id, status FROM public.mentorships WHERE id = $1 FOR UPDATE")) {
          const mid = params?.[0];
          const m = mentorshipsTable.get(mid);
          return { rows: m ? [m] : [] };
        }

        // Accept request: lock student profile
        if (text.includes("SELECT id, institution_id FROM public.profiles WHERE id = $1 FOR UPDATE")) {
          const sid = params?.[0];
          if (lockedStudents.has(sid)) {
            throw new Error(`Concurrency Conflict: student profile ${sid} is locked by another transaction`);
          }
          lockedStudents.add(sid);
          clientLockedStudent = sid;
          const p = profilesTable.get(sid);
          return { rows: p ? [{ id: p.id, institution_id: p.institution_id }] : [] };
        }

        // Profile lookup
        if (text.includes("SELECT institution_id FROM public.profiles WHERE id = $1")) {
          const sid = params?.[0];
          const p = profilesTable.get(sid);
          return { rows: p ? [{ institution_id: p.institution_id }] : [] };
        }

        // Update status = 'active'
        if (text.startsWith("UPDATE public.mentorships") && text.includes("SET status = 'active'")) {
          const mid = params?.[0];
          const m = mentorshipsTable.get(mid);
          if (m) {
            m.status = "active";
            m.updated_at = new Date().toISOString();
            mentorshipsTable.set(mid, m);
            return { rows: [m] };
          }
          return { rows: [] };
        }

        // Update status = 'rejected'
        if (text.startsWith("UPDATE public.mentorships") && text.includes("SET status = 'rejected'")) {
          const mid = params?.[0];
          const m = mentorshipsTable.get(mid);
          if (m) {
            m.status = "rejected";
            m.updated_at = new Date().toISOString();
            mentorshipsTable.set(mid, m);
            return { rows: [m] };
          }
          return { rows: [] };
        }

        return mockQueryFn(sql, params);
      },
      release: () => {
        if (clientLockedStudent) lockedStudents.delete(clientLockedStudent);
      },
    };
  };

  // Attach simulator to db
  (dbModule.db as any).query = mockQueryFn;
  (dbModule.db as any).connect = mockConnectFn;
  (dbModule.pool as any).query = mockQueryFn;
  (dbModule.pool as any).connect = mockConnectFn;
  if ((dbModule.db as any).pool) {
    (dbModule.db as any).pool.connect = mockConnectFn;
    (dbModule.db as any).pool.query = mockQueryFn;
  }

  // ---------------------------------------------------------------------------
  // TEST SUITE EXECUTION
  // ---------------------------------------------------------------------------

  console.log("--- 1. Authentication & Role Boundary Tests ---");

  // TEST 1: Unauthenticated access blocked
  let unauthBlocked = false;
  const mockUnauthReq: any = { headers: {} };
  const mockRes: any = {
    status: (code: number) => ({
      json: (body: any) => { if (code === 401) unauthBlocked = true; },
    }),
  };
  await requireAuth(mockUnauthReq, mockRes, () => {});
  assert(unauthBlocked, "Test 1: Unauthenticated request rejected with 401 Unauthorized");

  // TEST 2: Student blocked from faculty mentorship routes
  let studentBlocked = false;
  const mockStudentReq: any = { user: { id: "student-user-1", email: "aarav@aiia.edu.in", role: "student" } };
  const roleMiddleware = requireRole("faculty");
  const mockForbiddenRes: any = {
    status: (code: number) => ({
      json: (body: any) => { if (code === 403) studentBlocked = true; },
    }),
  };
  await roleMiddleware(mockStudentReq, mockForbiddenRes, () => {});
  assert(studentBlocked, "Test 2: Student role blocked from faculty mentorship route with 403 Forbidden");

  // TEST 3: Student blocked from creating faculty collaboration opportunities
  let studentCreateOppBlocked = false;
  try {
    await facultyCollaborationService.createOpportunity("student-user-1", {
      title: "Student Lead Workshop",
      description: "Student initiated collaboration",
      opportunityType: "workshop",
      status: "draft",
    });
  } catch (err: any) {
    if (err.statusCode === 403) studentCreateOppBlocked = true;
  }
  assert(studentCreateOppBlocked, "Test 3: Student blocked from authoring faculty opportunities (403 Forbidden)");

  console.log("\n--- 2. Student Mentorship & Same-Institution Rules ---");

  // TEST 4: Student without institution cannot request mentorship
  let unattachedStudentBlocked = false;
  try {
    await mentorshipService.requestMentorship("student-user-unaffiliated", {
      facultyId: "faculty-user-1",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("affiliated with an academic institution")) {
      unattachedStudentBlocked = true;
    }
  }
  assert(unattachedStudentBlocked, "Test 4: Unaffiliated student rejected from requesting mentorship (400 Bad Request)");

  // TEST 5: Cross-institution mentorship request blocked
  let crossInstRequestBlocked = false;
  try {
    // Student 1 (AIIA) requesting Faculty 3 (NIA)
    await mentorshipService.requestMentorship("student-user-1", {
      facultyId: "faculty-user-3",
    });
  } catch (err: any) {
    if (err.statusCode === 403 && err.message.includes("not affiliated with your institution")) {
      crossInstRequestBlocked = true;
    }
  }
  assert(crossInstRequestBlocked, "Test 5: Cross-institution mentorship request rejected (403 Forbidden)");

  // TEST 6: Valid same-institution mentorship request succeeds
  const requestRes = await mentorshipService.requestMentorship("student-user-1", {
    facultyId: "faculty-user-1",
    requestNote: "Seeking guidance in Ayurvedic Clinical Internal Medicine.",
  });
  assert(
    requestRes.status === "pending" && requestRes.faculty_id === "faculty-user-1",
    "Test 6: Student submits pending mentorship request to same-institution faculty mentor",
    `Mentorship ID: ${requestRes.id}, Status: ${requestRes.status}`
  );

  // TEST 7: Duplicate request to same faculty rejected
  let duplicateRequestBlocked = false;
  try {
    await mentorshipService.requestMentorship("student-user-1", {
      facultyId: "faculty-user-1",
    });
  } catch (err: any) {
    if (err.statusCode === 409 && err.message.includes("already have a pending mentorship request")) {
      duplicateRequestBlocked = true;
    }
  }
  assert(duplicateRequestBlocked, "Test 7: Duplicate request between same faculty/student pair blocked (409 Conflict)");

  // TEST 8: Student dashboard omits mentor_note and displays available institution faculty
  const studentDash = await mentorshipService.getStudentDashboard("student-user-1");
  assert(
    studentDash.pendingMentorship?.id === requestRes.id &&
      !("mentorNote" in (studentDash.pendingMentorship as any)) &&
      studentDash.availableFaculty.length === 2,
    "Test 8: Student dashboard omits private mentor notes and lists only same-institution faculty",
    `Pending: ${studentDash.pendingMentorship?.facultyName}, Institution Faculty: ${studentDash.availableFaculty.length}`
  );

  console.log("\n--- 3. Faculty Mentorship Review & Concurrency Safety ---");

  // TEST 9: Faculty can view incoming pending requests
  const facultyDash = await mentorshipService.getFacultyDashboard("faculty-user-1");
  assert(
    facultyDash.pendingRequests.length === 1 && facultyDash.pendingRequests[0].id === requestRes.id,
    "Test 9: Faculty pipeline retrieves pending student mentorship request with student details"
  );

  // TEST 10: Unauthorized faculty cannot accept another faculty's request
  let wrongFacultyAcceptBlocked = false;
  try {
    await mentorshipService.acceptRequest("faculty-user-2", requestRes.id);
  } catch (err: any) {
    if (err.statusCode === 403) wrongFacultyAcceptBlocked = true;
  }
  assert(wrongFacultyAcceptBlocked, "Test 10: Non-assigned faculty blocked from accepting mentorship request (403 Forbidden)");

  // TEST 11: Assigned faculty accepts request -> status becomes active
  const acceptedRes = await mentorshipService.acceptRequest("faculty-user-1", requestRes.id);
  assert(
    acceptedRes.status === "active",
    "Test 11: Assigned faculty accepts request and status transitions from pending to active"
  );

  // TEST 12: Single Active Mentor Enforcement: Student cannot request another mentor while one is active
  let secondActiveMentorRequestBlocked = false;
  try {
    // Student 1 now has active mentor (Faculty 1), attempts to request Faculty 2
    await mentorshipService.requestMentorship("student-user-1", {
      facultyId: "faculty-user-2",
    });
  } catch (err: any) {
    if (err.statusCode === 409 && err.message.includes("already have an active faculty mentor")) {
      secondActiveMentorRequestBlocked = true;
    }
  }
  assert(secondActiveMentorRequestBlocked, "Test 12: Student with active mentor blocked from requesting a second mentor (409 Conflict)");

  // TEST 13: Concurrency Safety: Direct initiation checks student row lock and active mentor constraint
  let directInitiationBlocked = false;
  try {
    await mentorshipService.initiateMentorship("faculty-user-2", {
      studentId: "student-user-1",
    });
  } catch (err: any) {
    if (err.statusCode === 409 && err.message.includes("already has an active faculty mentor")) {
      directInitiationBlocked = true;
    }
  }
  assert(directInitiationBlocked, "Test 13: Direct initiation transaction serializes and rejects student with active mentor (409 Conflict)");

  // TEST 14: Faculty updates private mentor_note for active mentee
  const noteUpdate = await mentorshipService.updateMentorNote("faculty-user-1", requestRes.id, {
    mentorNote: "Focus on classical Charaka Samhita Chikitsa Sthana differential diagnosis.",
  });
  assert(
    noteUpdate.mentor_note.includes("Charaka Samhita"),
    "Test 14: Faculty mentor successfully saves private case guidance note"
  );

  // TEST 15: Faculty marks mentorship completed (active -> completed)
  const completedRes = await mentorshipService.completeMentorship("faculty-user-1", requestRes.id);
  assert(
    completedRes.status === "completed",
    "Test 15: Faculty marks mentorship as completed (active -> completed)"
  );

  // TEST 16: Concluded mentorship rejects note mutation (terminal state enforcement)
  let postCompletionNoteBlocked = false;
  try {
    await mentorshipService.updateMentorNote("faculty-user-1", requestRes.id, {
      mentorNote: "Attempting to edit completed note",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("concluded mentorship")) {
      postCompletionNoteBlocked = true;
    }
  }
  assert(postCompletionNoteBlocked, "Test 16: Guidance note update blocked on completed mentorship (400 Bad Request)");

  // TEST 17: Historical Re-Request: Student can request mentorship again now that prior mentorship is completed
  const reRequest = await mentorshipService.requestMentorship("student-user-1", {
    facultyId: "faculty-user-2",
    requestNote: "Requesting guidance in Panchakarma clinical procedures.",
  });
  assert(
    reRequest.status === "pending" && reRequest.faculty_id === "faculty-user-2",
    "Test 17: Historical re-request succeeds after earlier mentorship was concluded"
  );

  // Faculty 2 rejects this request to test rejection state
  const rejectedRes = await mentorshipService.rejectRequest("faculty-user-2", reRequest.id);
  assert(
    rejectedRes.status === "rejected",
    "Test 18: Faculty can reject pending request (pending -> rejected)"
  );

  console.log("\n--- 4. Faculty Collaboration Opportunities ---");

  // TEST 19: Authenticated discovery returns published opportunities
  const publishedOpps = await facultyCollaborationService.listOpportunities("faculty-user-1");
  assert(
    publishedOpps.length >= 1 && publishedOpps[0].status === "published",
    "Test 19: Authenticated discovery returns published collaborative opportunities",
    `Found: ${publishedOpps.length} published programs`
  );

  // TEST 20: Creator creates opportunity in draft mode
  const newDraftOpp = await facultyCollaborationService.createOpportunity("faculty-user-1", {
    title: "Clinical Ayurveda Oncology Research Consortium",
    description: "Multicenter collaborative research initiative on Rasayana adjunct therapy in integrative oncology.",
    opportunityType: "research_project",
    providerName: "AIIA Research Cell",
    location: "New Delhi",
    mode: "hybrid",
    status: "draft",
  });
  assert(
    newDraftOpp.status === "draft",
    "Test 20: Creator authors opportunity in draft status",
    `Draft ID: ${newDraftOpp.id}`
  );

  // TEST 21: Draft opportunity is hidden from other faculty discovery
  const otherFacultyDiscovery = await facultyCollaborationService.listOpportunities("faculty-user-3");
  const includesDraft = otherFacultyDiscovery.some((o) => o.id === newDraftOpp.id);
  assert(!includesDraft, "Test 21: Draft opportunity is strictly hidden from other faculty discovery");

  // TEST 22: Non-author cannot modify opportunity metadata
  let nonAuthorEditBlocked = false;
  try {
    await facultyCollaborationService.updateOpportunityMetadata("faculty-user-3", newDraftOpp.id, {
      title: "Hacked Title",
    });
  } catch (err: any) {
    if (err.statusCode === 403) nonAuthorEditBlocked = true;
  }
  assert(nonAuthorEditBlocked, "Test 22: Non-author blocked from editing opportunity metadata (403 Forbidden)");

  // TEST 23: Author transitions opportunity: draft -> published -> closed -> published -> archived
  const publishedTransition = await facultyCollaborationService.updateOpportunityStatus("faculty-user-1", newDraftOpp.id, {
    status: "published",
  });
  assert(publishedTransition.status === "published", "Test 23.1: Author publishes draft opportunity (draft -> published)");

  const closedTransition = await facultyCollaborationService.updateOpportunityStatus("faculty-user-1", newDraftOpp.id, {
    status: "closed",
  });
  assert(closedTransition.status === "closed", "Test 23.2: Author closes intake (published -> closed)");

  const reOpenTransition = await facultyCollaborationService.updateOpportunityStatus("faculty-user-1", newDraftOpp.id, {
    status: "published",
  });
  assert(reOpenTransition.status === "published", "Test 23.3: Author re-opens closed opportunity (closed -> published)");

  console.log("\n--- 5. Collaboration Interests & Review State Machine ---");

  // TEST 24: Faculty expresses interest in published opportunity
  const interestRes = await facultyCollaborationService.expressInterest("faculty-user-3", newDraftOpp.id, {
    message: "NIA Dravyaguna department offers standardization of botanical extracts for this project.",
  });
  assert(
    interestRes.status === "interested" && interestRes.opportunity_id === newDraftOpp.id,
    "Test 24: Faculty applicant expresses interest in published opportunity (status = 'interested')"
  );

  // TEST 25: Duplicate interest expression rejected with 409 Conflict
  let duplicateInterestBlocked = false;
  try {
    await facultyCollaborationService.expressInterest("faculty-user-3", newDraftOpp.id, {
      message: "Duplicate submission",
    });
  } catch (err: any) {
    if (err.statusCode === 409) duplicateInterestBlocked = true;
  }
  assert(duplicateInterestBlocked, "Test 25: Duplicate interest expression rejected with 409 Conflict");

  // TEST 26: Applicant can update message while status is 'interested'
  const messageUpdate = await facultyCollaborationService.updateInterestMessage("faculty-user-3", interestRes.id, {
    message: "Updated: NIA Dravyaguna department offers full laboratory monograph validation.",
  });
  assert(
    messageUpdate.message.includes("monograph validation"),
    "Test 26: Applicant successfully updates statement message while status is 'interested'"
  );

  // TEST 27: Author reviews applicants for owned opportunity
  const applicantsList = await facultyCollaborationService.listOpportunityApplicants("faculty-user-1", newDraftOpp.id);
  assert(
    applicantsList.applicants.length === 1 && applicantsList.applicants[0].id === interestRes.id,
    "Test 27: Opportunity author successfully reviews applicant submissions with faculty profiles"
  );

  // TEST 28: Non-author cannot review applicants
  let nonAuthorReviewBlocked = false;
  try {
    await facultyCollaborationService.listOpportunityApplicants("faculty-user-2", newDraftOpp.id);
  } catch (err: any) {
    if (err.statusCode === 403) nonAuthorReviewBlocked = true;
  }
  assert(nonAuthorReviewBlocked, "Test 28: Non-author blocked from reviewing applicant submissions (403 Forbidden)");

  // TEST 29: State Machine: Author moves applicant to 'under_review'
  const underReviewRes = await facultyCollaborationService.updateApplicantStatus("faculty-user-1", interestRes.id, {
    status: "under_review",
  });
  assert(underReviewRes.status === "under_review", "Test 29: Author transitions applicant from 'interested' to 'under_review'");

  // TEST 30: Message cannot be modified once status is 'under_review'
  let postReviewMessageBlocked = false;
  try {
    await facultyCollaborationService.updateInterestMessage("faculty-user-3", interestRes.id, {
      message: "Attempting to change under review message",
    });
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("under review or decided")) {
      postReviewMessageBlocked = true;
    }
  }
  assert(postReviewMessageBlocked, "Test 30: Applicant blocked from editing message once under review (400 Bad Request)");

  // TEST 31: State Machine: Author accepts applicant (under_review -> accepted)
  const acceptedCollab = await facultyCollaborationService.updateApplicantStatus("faculty-user-1", interestRes.id, {
    status: "accepted",
  });
  assert(acceptedCollab.status === "accepted", "Test 31: Author accepts applicant (under_review -> accepted)");

  // TEST 32: Terminal State: Applicant cannot withdraw once accepted
  let withdrawAcceptedBlocked = false;
  try {
    await facultyCollaborationService.withdrawInterest("faculty-user-3", interestRes.id);
  } catch (err: any) {
    if (err.statusCode === 400 && err.message.includes("after it has been accepted or rejected")) {
      withdrawAcceptedBlocked = true;
    }
  }
  assert(withdrawAcceptedBlocked, "Test 32: Applicant blocked from withdrawing after acceptance (400 Bad Request)");

  console.log("\n================================================================================");
  console.log(` MODULE 5 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runModule5Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
