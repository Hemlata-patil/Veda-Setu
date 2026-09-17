import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import {
  CreatePlacementTrackingInput,
  UpdatePlacementTrackingInput,
} from "../utils/validation";

export class PlacementService {
  /**
   * Industry creates a placement tracking record for a selected candidate application.
   */
  async createPlacementTracking(industryUserId: string, input: CreatePlacementTrackingInput) {
    // 1. Fetch application, verify status is 'selected' and opportunity owner is industryUserId
    const appRes = await db.query(
      `SELECT a.id, a.status, a.student_id, o.id AS opportunity_id, o.created_by
       FROM public.applications a
       JOIN public.opportunities o ON a.opportunity_id = o.id
       WHERE a.id = $1`,
      [input.applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError("Referenced application not found.", 404);
    }

    const application = appRes.rows[0];

    if (application.created_by !== industryUserId) {
      throw new AppError("Unauthorized: You do not own the opportunity linked to this application.", 403);
    }

    if (application.status !== "selected") {
      throw new AppError(
        `Tracking can only be initiated for applications with status 'selected' (current status: '${application.status}').`,
        400
      );
    }

    // 2. Validate dates
    if (input.startDate && input.expectedEndDate && new Date(input.expectedEndDate) < new Date(input.startDate)) {
      throw new AppError("Expected end date cannot be earlier than start date.", 400);
    }

    // 3. Check for duplicate placement record on application
    const existing = await db.query(
      `SELECT id FROM public.internship_placements WHERE application_id = $1`,
      [input.applicationId]
    );
    if (existing.rows.length > 0) {
      throw new AppError("A tracking record already exists for this application.", 409);
    }

    // 3. Insert placement record
    const insertRes = await db.query(
      `INSERT INTO public.internship_placements (
         application_id,
         engagement_type,
         status,
         start_date,
         expected_end_date,
         supervisor_name,
         supervisor_email,
         progress_percent
       ) VALUES ($1, $2, 'selected', $3, $4, $5, $6, 0)
       RETURNING *`,
      [
        input.applicationId,
        input.engagementType,
        input.startDate || null,
        input.expectedEndDate || null,
        input.supervisorName || null,
        input.supervisorEmail || null,
      ]
    );

    return insertRes.rows[0];
  }

  /**
   * Industry updates placement tracking progression and lifecycle status.
   */
  async updatePlacementTracking(
    industryUserId: string,
    placementId: string,
    input: UpdatePlacementTrackingInput
  ) {
    // 1. Lookup placement and owner
    const pRes = await db.query(
      `SELECT p.*, o.created_by
       FROM public.internship_placements p
       JOIN public.applications a ON p.application_id = a.id
       JOIN public.opportunities o ON a.opportunity_id = o.id
       WHERE p.id = $1`,
      [placementId]
    );

    if (pRes.rows.length === 0) {
      throw new AppError("Internship/placement tracking record not found.", 404);
    }

    const current = pRes.rows[0];

    if (current.created_by !== industryUserId) {
      throw new AppError("Unauthorized: You do not own the opportunity linked to this placement.", 403);
    }

    // 2. Validate exact state transitions if status is changing
    if (input.status && input.status !== current.status) {
      const oldStatus = current.status;
      const newStatus = input.status;

      // Terminal state check
      if (oldStatus === "completed" || oldStatus === "withdrawn") {
        throw new AppError(`Cannot transition from terminal state '${oldStatus}'.`, 400);
      }

      // Exact transition rules
      if (oldStatus === "selected") {
        if (newStatus !== "offer_accepted" && newStatus !== "withdrawn") {
          throw new AppError(`Invalid transition from 'selected' to '${newStatus}'.`, 400);
        }
      } else if (oldStatus === "offer_accepted") {
        if (newStatus !== "joined" && newStatus !== "withdrawn") {
          throw new AppError(`Invalid transition from 'offer_accepted' to '${newStatus}'.`, 400);
        }
      } else if (oldStatus === "joined") {
        if (newStatus !== "in_progress") {
          throw new AppError(`Invalid transition from 'joined' to '${newStatus}'.`, 400);
        }
      } else if (oldStatus === "in_progress") {
        if (newStatus !== "completed") {
          throw new AppError(`Invalid transition from 'in_progress' to '${newStatus}'.`, 400);
        }
      }
    }

    // 3. Validate start/end dates
    const finalStartDate = input.startDate !== undefined ? input.startDate : current.start_date;
    const finalExpectedEndDate =
      input.expectedEndDate !== undefined ? input.expectedEndDate : current.expected_end_date;
    const finalActualEndDate = input.actualEndDate !== undefined ? input.actualEndDate : current.actual_end_date;

    if (finalStartDate && finalExpectedEndDate && new Date(finalExpectedEndDate) < new Date(finalStartDate)) {
      throw new AppError("Expected end date cannot be earlier than start date.", 400);
    }

    if (finalStartDate && finalActualEndDate && new Date(finalActualEndDate) < new Date(finalStartDate)) {
      throw new AppError("Actual end date cannot be earlier than start date.", 400);
    }

    // 4. Perform update on mutable fields
    const updateRes = await db.query(
      `UPDATE public.internship_placements
       SET status = COALESCE($1, status),
           start_date = CASE WHEN $2::text IS NOT NULL THEN $2::date ELSE start_date END,
           expected_end_date = CASE WHEN $3::text IS NOT NULL THEN $3::date ELSE expected_end_date END,
           actual_end_date = CASE WHEN $4::text IS NOT NULL THEN $4::date ELSE actual_end_date END,
           progress_percent = COALESCE($5, progress_percent),
           supervisor_name = CASE WHEN $6::text IS NOT NULL THEN $6 ELSE supervisor_name END,
           supervisor_email = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE supervisor_email END,
           outcome = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE outcome END,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        input.status || null,
        input.startDate !== undefined ? input.startDate : null,
        input.expectedEndDate !== undefined ? input.expectedEndDate : null,
        input.actualEndDate !== undefined ? input.actualEndDate : null,
        input.progressPercent !== undefined ? input.progressPercent : null,
        input.supervisorName !== undefined ? input.supervisorName : null,
        input.supervisorEmail !== undefined ? input.supervisorEmail : null,
        input.outcome !== undefined ? input.outcome : null,
        placementId,
      ]
    );

    return updateRes.rows[0];
  }

  /**
   * Student fetches their own placement records.
   */
  async getStudentPlacements(studentUserId: string) {
    const res = await db.query(
      `SELECT p.*,
              a.id AS application_id, a.status AS application_status, a.applied_at,
              o.id AS opportunity_id, o.title AS opportunity_title, o.opportunity_type,
              o.location AS opportunity_location, o.work_mode AS opportunity_mode,
              org.id AS organization_id, org.name AS organization_name, org.organization_type
       FROM public.internship_placements p
       JOIN public.applications a ON p.application_id = a.id
       JOIN public.opportunities o ON a.opportunity_id = o.id
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       WHERE a.student_id = $1
       ORDER BY p.created_at DESC`,
      [studentUserId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      applicationId: r.application_id,
      engagementType: r.engagement_type,
      status: r.status,
      startDate: r.start_date,
      expectedEndDate: r.expected_end_date,
      actualEndDate: r.actual_end_date,
      progressPercent: Number(r.progress_percent),
      supervisorName: r.supervisor_name,
      supervisorEmail: r.supervisor_email,
      outcome: r.outcome,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      opportunity: {
        id: r.opportunity_id,
        title: r.opportunity_title,
        opportunityType: r.opportunity_type,
        location: r.opportunity_location,
        mode: r.opportunity_mode,
      },
      organization: r.organization_id
        ? {
            id: r.organization_id,
            name: r.organization_name,
            organizationType: r.organization_type,
          }
        : null,
    }));
  }

  /**
   * Industry fetches all placement tracking records for opportunities they authored.
   * If includeUnplaced is true, includes selected applications that do not yet have a placement.
   */
  async getIndustryPlacements(industryUserId: string, includeUnplaced: boolean = false) {
    if (includeUnplaced) {
      const res = await db.query(
        `SELECT p.id, p.engagement_type, p.status, p.start_date, p.expected_end_date,
                p.actual_end_date, p.progress_percent, p.supervisor_name, p.supervisor_email,
                p.outcome, p.created_at, p.updated_at,
                a.id AS application_id, a.status AS application_status, a.applied_at, a.student_id,
                stu.full_name AS student_name, stu_u.email AS student_email, stu.program AS student_program,
                stu.year AS student_year, stu.department AS student_department,
                inst.name AS institution_name, inst.code AS institution_code,
                o.id AS opportunity_id, o.title AS opportunity_title, o.opportunity_type
         FROM public.applications a
         JOIN public.opportunities o ON a.opportunity_id = o.id
         JOIN public.profiles stu ON a.student_id = stu.id
         JOIN public.users stu_u ON stu.id = stu_u.id
         LEFT JOIN public.institutions inst ON stu.institution_id = inst.id
         LEFT JOIN public.internship_placements p ON p.application_id = a.id
         WHERE o.created_by = $1 AND a.status = 'selected'
         ORDER BY a.applied_at DESC`,
        [industryUserId]
      );

      return res.rows.map((r: any) => ({
        id: r.id || null,
        applicationId: r.application_id,
        engagementType: r.engagement_type || null,
        status: r.status || null,
        startDate: r.start_date || null,
        expectedEndDate: r.expected_end_date || null,
        actualEndDate: r.actual_end_date || null,
        progressPercent: r.progress_percent !== null ? Number(r.progress_percent) : 0,
        supervisorName: r.supervisor_name || null,
        supervisorEmail: r.supervisor_email || null,
        outcome: r.outcome || null,
        createdAt: r.created_at || null,
        updatedAt: r.updated_at || null,
        student: {
          id: r.student_id,
          fullName: r.student_name,
          email: r.student_email,
          program: r.student_program,
          year: r.student_year,
          department: r.student_department,
          institutionName: r.institution_name,
          institutionCode: r.institution_code,
        },
        opportunity: {
          id: r.opportunity_id,
          title: r.opportunity_title,
          opportunityType: r.opportunity_type,
        },
      }));
    }

    const res = await db.query(
      `SELECT p.*,
              a.id AS application_id, a.status AS application_status, a.applied_at, a.student_id,
              stu.full_name AS student_name, stu_u.email AS student_email, stu.program AS student_program,
              stu.year AS student_year, stu.department AS student_department,
              inst.name AS institution_name, inst.code AS institution_code,
              o.id AS opportunity_id, o.title AS opportunity_title, o.opportunity_type
       FROM public.internship_placements p
       JOIN public.applications a ON p.application_id = a.id
       JOIN public.opportunities o ON a.opportunity_id = o.id
       JOIN public.profiles stu ON a.student_id = stu.id
       JOIN public.users stu_u ON stu.id = stu_u.id
       LEFT JOIN public.institutions inst ON stu.institution_id = inst.id
       WHERE o.created_by = $1
       ORDER BY p.created_at DESC`,
      [industryUserId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      applicationId: r.application_id,
      engagementType: r.engagement_type,
      status: r.status,
      startDate: r.start_date,
      expectedEndDate: r.expected_end_date,
      actualEndDate: r.actual_end_date,
      progressPercent: Number(r.progress_percent),
      supervisorName: r.supervisor_name,
      supervisorEmail: r.supervisor_email,
      outcome: r.outcome,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      student: {
        id: r.student_id,
        fullName: r.student_name,
        email: r.student_email,
        program: r.student_program,
        year: r.student_year,
        department: r.student_department,
        institutionName: r.institution_name,
        institutionCode: r.institution_code,
      },
      opportunity: {
        id: r.opportunity_id,
        title: r.opportunity_title,
        opportunityType: r.opportunity_type,
      },
    }));
  }

  /**
   * Institution fetches placement tracking records for students belonging to their institution.
   */
  async getInstitutionPlacements(institutionUserId: string) {
    // 1. Get caller's institution_id
    const profRes = await db.query(
      `SELECT institution_id FROM public.profiles WHERE id = $1`,
      [institutionUserId]
    );
    const institutionId = profRes.rows[0]?.institution_id;
    if (!institutionId) {
      throw new AppError("Institution profile not found or unassociated.", 403);
    }

    const res = await db.query(
      `SELECT p.*,
              a.id AS application_id, a.status AS application_status, a.applied_at, a.student_id,
              stu.full_name AS student_name, stu_u.email AS student_email, stu.program AS student_program,
              stu.year AS student_year, stu.department AS student_department,
              o.id AS opportunity_id, o.title AS opportunity_title, o.opportunity_type,
              org.id AS organization_id, org.name AS organization_name, org.organization_type
       FROM public.internship_placements p
       JOIN public.applications a ON p.application_id = a.id
       JOIN public.opportunities o ON a.opportunity_id = o.id
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       JOIN public.profiles stu ON a.student_id = stu.id
       JOIN public.users stu_u ON stu.id = stu_u.id
       WHERE stu.institution_id = $1
       ORDER BY p.created_at DESC`,
      [institutionId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      applicationId: r.application_id,
      engagementType: r.engagement_type,
      status: r.status,
      startDate: r.start_date,
      expectedEndDate: r.expected_end_date,
      actualEndDate: r.actual_end_date,
      progressPercent: Number(r.progress_percent),
      supervisorName: r.supervisor_name,
      outcome: r.outcome,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      student: {
        id: r.student_id,
        fullName: r.student_name,
        email: r.student_email,
        program: r.student_program,
        year: r.student_year,
        department: r.student_department,
      },
      opportunity: {
        id: r.opportunity_id,
        title: r.opportunity_title,
        opportunityType: r.opportunity_type,
      },
      organization: r.organization_id
        ? {
            id: r.organization_id,
            name: r.organization_name,
            organizationType: r.organization_type,
          }
        : null,
    }));
  }

  /**
   * Scoped single placement detail lookup verifying authorization per caller role.
   */
  async getPlacementById(callerUserId: string, callerRole: string, placementId: string) {
    const res = await db.query(
      `SELECT p.*,
              a.id AS application_id, a.student_id,
              stu.institution_id AS student_institution_id,
              stu.full_name AS student_name, stu_u.email AS student_email,
              o.id AS opportunity_id, o.created_by AS opportunity_creator_id,
              o.title AS opportunity_title, o.opportunity_type,
              org.id AS organization_id, org.name AS organization_name
       FROM public.internship_placements p
       JOIN public.applications a ON p.application_id = a.id
       JOIN public.opportunities o ON a.opportunity_id = o.id
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       JOIN public.profiles stu ON a.student_id = stu.id
       JOIN public.users stu_u ON stu.id = stu_u.id
       WHERE p.id = $1`,
      [placementId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Placement record not found.", 404);
    }

    const r = res.rows[0];

    // Authorize based on caller role
    if (callerRole === "student") {
      if (r.student_id !== callerUserId) {
        throw new AppError("Unauthorized: You do not own this placement record.", 403);
      }
    } else if (callerRole === "industry") {
      if (r.opportunity_creator_id !== callerUserId) {
        throw new AppError("Unauthorized: You do not own the opportunity for this placement.", 403);
      }
    } else if (callerRole === "institution" || callerRole === "faculty") {
      const callerProf = await db.query(
        `SELECT institution_id FROM public.profiles WHERE id = $1`,
        [callerUserId]
      );
      const callerInstId = callerProf.rows[0]?.institution_id;
      if (!callerInstId || callerInstId !== r.student_institution_id) {
        throw new AppError("Unauthorized: Candidate does not belong to your affiliated institution.", 403);
      }
    }

    return {
      id: r.id,
      applicationId: r.application_id,
      engagementType: r.engagement_type,
      status: r.status,
      startDate: r.start_date,
      expectedEndDate: r.expected_end_date,
      actualEndDate: r.actual_end_date,
      progressPercent: Number(r.progress_percent),
      supervisorName: r.supervisor_name,
      supervisorEmail: r.supervisor_email,
      outcome: r.outcome,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      student: {
        id: r.student_id,
        fullName: r.student_name,
        email: r.student_email,
      },
      opportunity: {
        id: r.opportunity_id,
        title: r.opportunity_title,
        opportunityType: r.opportunity_type,
      },
      organization: r.organization_id
        ? {
            id: r.organization_id,
            name: r.organization_name,
          }
        : null,
    };
  }
}

export const placementService = new PlacementService();
