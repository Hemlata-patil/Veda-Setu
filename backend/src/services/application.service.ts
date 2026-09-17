import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import {
  calculateOpportunitySkillMatch,
  OpportunityCompetencyRequirement,
  OpportunitySkillMatchResult,
} from "./matching.service";

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "selected"
  | "withdrawn";

export interface StudentApplicationSummary {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityType: string;
  organizationName: string | null;
  location: string | null;
  workMode: string | null;
  status: ApplicationStatus;
  coverNote: string | null;
  appliedAt: string;
  matchResult: OpportunitySkillMatchResult;
}

export interface IndustryCandidateSummary {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityType: string;
  studentId: string;
  studentEmail: string;
  status: ApplicationStatus;
  coverNote: string | null;
  appliedAt: string;
  updatedAt: string;
  matchResult: OpportunitySkillMatchResult;
}

export class ApplicationService {
  /**
   * Student: Submit application to a published opportunity
   * Validates:
   * 1. Opportunity exists & is published
   * 2. Opportunity is not closed or archived
   * 3. Student has not already applied (duplicate protection)
   */
  async submitApplication(
    studentUserId: string,
    opportunityId: string,
    coverNote?: string
  ): Promise<{ applicationId: string }> {
    // 1. Check opportunity status
    const oppRes = await db.query(
      `SELECT id, status, application_deadline FROM public.opportunities WHERE id = $1`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }

    const opp = oppRes.rows[0];
    if (opp.status !== "published") {
      throw new AppError(
        `Cannot apply to an opportunity with status '${opp.status}'. Only published opportunities accept applications.`,
        400
      );
    }

    // Check application deadline if present
    if (opp.application_deadline) {
      const deadline = new Date(opp.application_deadline);
      const now = new Date();
      // Only compare date if passed
      if (deadline < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        throw new AppError("The application deadline for this opportunity has passed.", 400);
      }
    }

    // 2. Check for duplicate application
    const dupRes = await db.query(
      `SELECT id FROM public.applications WHERE opportunity_id = $1 AND student_id = $2`,
      [opportunityId, studentUserId]
    );

    if (dupRes.rows.length > 0) {
      throw new AppError("You have already applied to this opportunity.", 409);
    }

    // 3. Insert application record
    try {
      const insertRes = await db.query(
        `INSERT INTO public.applications (
          opportunity_id,
          student_id,
          status,
          cover_note
        ) VALUES ($1, $2, 'applied', $3)
        RETURNING id`,
        [opportunityId, studentUserId, coverNote?.trim() || null]
      );

      return { applicationId: insertRes.rows[0].id };
    } catch (err: any) {
      // Catch unique constraint violation if race condition occurred
      if (err.code === "23505" || err.message?.includes("uq_applications_opportunity_student")) {
        throw new AppError("You have already applied to this opportunity.", 409);
      }
      throw err;
    }
  }

  /**
   * Student: Retrieve list of own applications with opportunity details and match results
   */
  async getStudentApplications(studentUserId: string): Promise<StudentApplicationSummary[]> {
    // 1. Fetch student's assessed competencies from DB
    const studentCompsRes = await db.query(
      `SELECT competency_id, proficiency_score
       FROM public.student_competencies
       WHERE student_id = $1`,
      [studentUserId]
    );

    const studentScoresMap = new Map<string, number>();
    for (const row of studentCompsRes.rows) {
      studentScoresMap.set(row.competency_id, Number(row.proficiency_score));
    }

    // 2. Fetch applications with opportunity + organization
    const appsRes = await db.query(
      `SELECT a.id, a.opportunity_id, a.status, a.cover_note, a.applied_at,
              o.title AS opportunity_title, o.opportunity_type, o.location, o.work_mode,
              org.name AS organization_name
       FROM public.applications a
       JOIN public.opportunities o ON a.opportunity_id = o.id
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentUserId]
    );

    const appRows = appsRes.rows;
    if (appRows.length === 0) return [];

    const oppIds = Array.from(new Set(appRows.map((r: any) => r.opportunity_id)));

    // 3. Fetch requirements
    const compReqsRes = await db.query(
      `SELECT oc.opportunity_id, oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = ANY($1::uuid[])
       ORDER BY c.name ASC`,
      [oppIds]
    );

    const reqsByOpp = new Map<string, OpportunityCompetencyRequirement[]>();
    for (const r of compReqsRes.rows) {
      const list = reqsByOpp.get(r.opportunity_id) || [];
      list.push({
        competencyId: r.competency_id,
        competencyName: r.competency_name,
        category: r.category,
        requiredScore: Number(r.required_score),
        weight: Number(r.weight),
      });
      reqsByOpp.set(r.opportunity_id, list);
    }

    return appRows.map((app: any) => {
      const reqs = reqsByOpp.get(app.opportunity_id) || [];
      const matchResult = calculateOpportunitySkillMatch(reqs, studentScoresMap);

      return {
        id: app.id,
        opportunityId: app.opportunity_id,
        opportunityTitle: app.opportunity_title,
        opportunityType: app.opportunity_type,
        organizationName: app.organization_name,
        location: app.location,
        workMode: app.work_mode,
        status: app.status,
        coverNote: app.cover_note,
        appliedAt: app.applied_at,
        matchResult,
      };
    });
  }

  /**
   * Student: Withdraw application
   * Lifecycle check:
   * Only allowed from 'applied' or 'under_review'.
   * Cannot withdraw if 'shortlisted', 'selected', 'rejected', or already 'withdrawn'.
   */
  async withdrawApplication(
    studentUserId: string,
    applicationId: string
  ): Promise<{ success: boolean }> {
    const appRes = await db.query(
      `SELECT id, student_id, status FROM public.applications WHERE id = $1`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError("Application not found", 404);
    }

    const app = appRes.rows[0];
    if (app.student_id !== studentUserId) {
      throw new AppError("Access denied. You do not own this application.", 403);
    }

    if (app.status === "withdrawn") {
      throw new AppError("Application is already withdrawn.", 400);
    }

    if (!["applied", "under_review"].includes(app.status)) {
      throw new AppError(
        `Cannot withdraw application with status '${app.status}'. Applications can only be withdrawn while 'applied' or 'under_review'.`,
        400
      );
    }

    await db.query(`UPDATE public.applications SET status = 'withdrawn' WHERE id = $1`, [
      applicationId,
    ]);

    return { success: true };
  }

  /**
   * Student: Update cover note (Enforce immutability rule: only allowed while status is 'applied')
   */
  async updateCoverNote(
    studentUserId: string,
    applicationId: string,
    newCoverNote: string
  ): Promise<{ success: boolean }> {
    const appRes = await db.query(
      `SELECT id, student_id, status FROM public.applications WHERE id = $1`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError("Application not found", 404);
    }

    const app = appRes.rows[0];
    if (app.student_id !== studentUserId) {
      throw new AppError("Access denied. You do not own this application.", 403);
    }

    if (app.status !== "applied") {
      throw new AppError(
        `Cover note is immutable once review has started (current status: '${app.status}').`,
        400
      );
    }

    await db.query(`UPDATE public.applications SET cover_note = $1 WHERE id = $2`, [
      newCoverNote.trim() || null,
      applicationId,
    ]);

    return { success: true };
  }

  /**
   * Industry: Get applicants for an opportunity created by the industry user
   */
  async getApplicantsForOpportunity(
    opportunityId: string,
    industryUserId: string
  ): Promise<IndustryCandidateSummary[]> {
    // 1. Verify opportunity ownership
    const oppRes = await db.query(
      `SELECT id, created_by, title, opportunity_type FROM public.opportunities WHERE id = $1`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }

    const opp = oppRes.rows[0];
    if (opp.created_by !== industryUserId) {
      throw new AppError("Access denied. You do not own this opportunity.", 403);
    }

    // 2. Fetch opportunity requirements
    const compReqsRes = await db.query(
      `SELECT oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = $1
       ORDER BY c.name ASC`,
      [opportunityId]
    );

    const requirements: OpportunityCompetencyRequirement[] = compReqsRes.rows.map((r: any) => ({
      competencyId: r.competency_id,
      competencyName: r.competency_name,
      category: r.category,
      requiredScore: Number(r.required_score),
      weight: Number(r.weight),
    }));

    // 3. Fetch applications + student user details
    const appsRes = await db.query(
      `SELECT a.id, a.opportunity_id, a.student_id, a.status, a.cover_note, a.applied_at, a.updated_at,
              u.email AS student_email
       FROM public.applications a
       JOIN public.users u ON a.student_id = u.id
       WHERE a.opportunity_id = $1
       ORDER BY a.applied_at DESC`,
      [opportunityId]
    );

    const appRows = appsRes.rows;
    if (appRows.length === 0) return [];

    const studentIds = Array.from(new Set(appRows.map((r: any) => r.student_id)));

    // 4. Fetch all student competency scores from DB
    const compsRes = await db.query(
      `SELECT student_id, competency_id, proficiency_score
       FROM public.student_competencies
       WHERE student_id = ANY($1::uuid[])`,
      [studentIds]
    );

    const scoresByStudent = new Map<string, Map<string, number>>();
    for (const r of compsRes.rows) {
      let map = scoresByStudent.get(r.student_id);
      if (!map) {
        map = new Map<string, number>();
        scoresByStudent.set(r.student_id, map);
      }
      map.set(r.competency_id, Number(r.proficiency_score));
    }

    // 5. Construct results
    return appRows.map((app: any) => {
      const studentMap = scoresByStudent.get(app.student_id) || new Map<string, number>();
      const matchResult = calculateOpportunitySkillMatch(requirements, studentMap);

      return {
        id: app.id,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        opportunityType: opp.opportunity_type,
        studentId: app.student_id,
        studentEmail: app.student_email,
        status: app.status,
        coverNote: app.cover_note,
        appliedAt: app.applied_at,
        updatedAt: app.updated_at,
        matchResult,
      };
    });
  }

  /**
   * Industry: Get all applications across all opportunities created by the industry user
   */
  async getAllApplicantsForIndustry(industryUserId: string): Promise<any[]> {
    // 1. Fetch applications for opportunities created by this industry user
    const appsRes = await db.query(
      `SELECT a.id, a.opportunity_id, a.student_id, a.status, a.cover_note, a.applied_at, a.updated_at,
              o.title AS opportunity_title, o.opportunity_type,
              u.email AS student_email,
              p.full_name AS student_name,
              inst.name AS institution_name
       FROM public.applications a
       JOIN public.opportunities o ON a.opportunity_id = o.id
       JOIN public.users u ON a.student_id = u.id
       LEFT JOIN public.profiles p ON a.student_id = p.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE o.created_by = $1
       ORDER BY a.applied_at DESC`,
      [industryUserId]
    );

    const appRows = appsRes.rows;
    if (appRows.length === 0) return [];

    const oppIds = Array.from(new Set(appRows.map((r: any) => r.opportunity_id)));
    const studentIds = Array.from(new Set(appRows.map((r: any) => r.student_id)));

    // 2. Fetch requirements for all these opportunities
    const compReqsRes = await db.query(
      `SELECT oc.opportunity_id, oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = ANY($1::uuid[])
       ORDER BY c.name ASC`,
      [oppIds]
    );

    const reqsByOpp = new Map<string, OpportunityCompetencyRequirement[]>();
    for (const r of compReqsRes.rows) {
      let list = reqsByOpp.get(r.opportunity_id);
      if (!list) {
        list = [];
        reqsByOpp.set(r.opportunity_id, list);
      }
      list.push({
        competencyId: r.competency_id,
        competencyName: r.competency_name,
        category: r.category,
        requiredScore: Number(r.required_score),
        weight: Number(r.weight),
      });
    }

    // 3. Fetch all student competency scores
    const compsRes = await db.query(
      `SELECT student_id, competency_id, proficiency_score
       FROM public.student_competencies
       WHERE student_id = ANY($1::uuid[])`,
      [studentIds]
    );

    const scoresByStudent = new Map<string, Map<string, number>>();
    for (const r of compsRes.rows) {
      let map = scoresByStudent.get(r.student_id);
      if (!map) {
        map = new Map<string, number>();
        scoresByStudent.set(r.student_id, map);
      }
      map.set(r.competency_id, Number(r.proficiency_score));
    }

    // 4. Calculate matches and format output
    return appRows.map((app: any) => {
      const requirements = reqsByOpp.get(app.opportunity_id) || [];
      const studentMap = scoresByStudent.get(app.student_id) || new Map<string, number>();
      const matchResult = calculateOpportunitySkillMatch(requirements, studentMap);

      return {
        id: app.id,
        opportunityId: app.opportunity_id,
        opportunityTitle: app.opportunity_title,
        opportunityType: app.opportunity_type,
        studentId: app.student_id,
        studentEmail: app.student_email,
        studentName: app.student_name,
        institutionName: app.institution_name,
        status: app.status,
        coverNote: app.cover_note,
        appliedAt: typeof app.applied_at === "string" ? app.applied_at : (app.applied_at?.toISOString?.() || new Date().toISOString()),
        updatedAt: typeof app.updated_at === "string" ? app.updated_at : (app.updated_at?.toISOString?.() || new Date().toISOString()),
        matchResult,
        studentProfile: {
          id: app.student_id,
          full_name: app.student_name || "Ayush Candidate",
          institutions: app.institution_name ? { name: app.institution_name } : null,
        },
        opportunity: {
          id: app.opportunity_id,
          title: app.opportunity_title,
          opportunity_type: app.opportunity_type,
        },
      };
    });
  }

  /**
   * Industry: Get candidate review detail for a single application
   */
  async getCandidateReviewDetail(
    applicationId: string,
    industryUserId: string
  ): Promise<any> {
    // 1. Fetch application and verify opportunity creator
    const appRes = await db.query(
      `SELECT a.*, o.id AS opp_id, o.title AS opp_title, o.opportunity_type, o.location, o.work_mode, o.created_by,
              u.email AS student_email,
              p.full_name AS student_name, p.program AS student_program, p.year AS student_year,
              inst.name AS institution_name
       FROM public.applications a
       JOIN public.opportunities o ON a.opportunity_id = o.id
       JOIN public.users u ON a.student_id = u.id
       LEFT JOIN public.profiles p ON a.student_id = p.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError("Application not found", 404);
    }

    const app = appRes.rows[0];
    if (app.created_by !== industryUserId) {
      throw new AppError("Access denied. You do not own the opportunity for this application.", 403);
    }

    // 2. Fetch requirements with description
    const compReqsRes = await db.query(
      `SELECT oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category, c.description
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = $1
       ORDER BY c.name ASC`,
      [app.opportunity_id]
    );

    const requirements: Array<OpportunityCompetencyRequirement & { description?: string | null }> = compReqsRes.rows.map((r: any) => ({
      competencyId: r.competency_id,
      competencyName: r.competency_name,
      category: r.category,
      description: r.description || null,
      requiredScore: Number(r.required_score),
      weight: Number(r.weight),
    }));

    // 3. Fetch candidate's assessed competencies from DB
    const compsRes = await db.query(
      `SELECT competency_id, proficiency_score
       FROM public.student_competencies
       WHERE student_id = $1`,
      [app.student_id]
    );

    const studentMap = new Map<string, number>();
    for (const r of compsRes.rows) {
      studentMap.set(r.competency_id, Number(r.proficiency_score));
    }

    const matchResult = calculateOpportunitySkillMatch(requirements, studentMap);

    return {
      id: app.id,
      opportunityId: app.opportunity_id,
      opportunityTitle: app.opp_title,
      opportunityType: app.opportunity_type,
      location: app.location || null,
      workMode: app.work_mode || null,
      studentId: app.student_id,
      studentEmail: app.student_email,
      studentName: app.student_name || "Ayush Candidate",
      studentProgram: app.student_program || null,
      studentYear: app.student_year || null,
      institutionName: app.institution_name || null,
      status: app.status,
      coverNote: app.cover_note,
      appliedAt: typeof app.applied_at === "string" ? app.applied_at : (app.applied_at?.toISOString?.() || new Date().toISOString()),
      updatedAt: typeof app.updated_at === "string" ? app.updated_at : (app.updated_at?.toISOString?.() || new Date().toISOString()),
      matchResult,
      requirements,
      studentProfile: {
        id: app.student_id,
        full_name: app.student_name || "Ayush Candidate",
        program: app.student_program || null,
        year: app.student_year || null,
        institutions: app.institution_name ? { name: app.institution_name } : null,
      },
      opportunity: {
        id: app.opportunity_id,
        title: app.opp_title,
        opportunity_type: app.opportunity_type,
        location: app.location,
        work_mode: app.work_mode,
        created_by: app.created_by,
      },
    };
  }

  /**
   * Industry: Transition candidate application status
   * Valid transitions:
   * applied -> under_review
   * under_review -> shortlisted | rejected
   * shortlisted -> selected | rejected
   * Terminal states: selected, rejected, withdrawn cannot be changed.
   */
  async updateCandidateStatus(
    applicationId: string,
    industryUserId: string,
    newStatus: ApplicationStatus
  ): Promise<{ success: boolean; status: ApplicationStatus }> {
    const appRes = await db.query(
      `SELECT a.id, a.status, o.created_by
       FROM public.applications a
       JOIN public.opportunities o ON a.opportunity_id = o.id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError("Application not found", 404);
    }

    const app = appRes.rows[0];
    if (app.created_by !== industryUserId) {
      throw new AppError("Access denied. You do not own the opportunity for this application.", 403);
    }

    const currentStatus = app.status as ApplicationStatus;
    if (currentStatus === newStatus) {
      return { success: true, status: currentStatus };
    }

    // Check terminal states
    if (["selected", "rejected", "withdrawn"].includes(currentStatus)) {
      throw new AppError(
        `Application in '${currentStatus}' status is in a terminal state and cannot be modified.`,
        400
      );
    }

    // Validate industry state transitions
    let allowed = false;
    let reason = "";

    if (currentStatus === "applied") {
      if (newStatus === "under_review") allowed = true;
      else reason = "New applications must first be marked 'under_review'.";
    } else if (currentStatus === "under_review") {
      if (["shortlisted", "rejected"].includes(newStatus)) allowed = true;
      else reason = "Under-review applications can only be transitioned to 'shortlisted' or 'rejected'.";
    } else if (currentStatus === "shortlisted") {
      if (["selected", "rejected"].includes(newStatus)) allowed = true;
      else reason = "Shortlisted candidates can only be transitioned to 'selected' or 'rejected'.";
    }

    if (!allowed) {
      throw new AppError(
        reason || `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        400
      );
    }

    await db.query(`UPDATE public.applications SET status = $1 WHERE id = $2`, [
      newStatus,
      applicationId,
    ]);

    return { success: true, status: newStatus };
  }
}

export const applicationService = new ApplicationService();
