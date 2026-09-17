import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import {
  CreateFacultyOpportunityInput,
  UpdateFacultyOpportunityInput,
  UpdateFacultyOpportunityStatusInput,
  ExpressFacultyInterestInput,
  UpdateFacultyInterestMessageInput,
  UpdateFacultyInterestStatusInput,
} from "../utils/validation";

export interface FacultyOpportunitySummary {
  id: string;
  title: string;
  description: string;
  opportunityType: string;
  providerName: string | null;
  location: string | null;
  mode: string | null;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  externalUrl: string | null;
  status: string;
  organizationId: string | null;
  organizationName?: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  myInterestStatus?: string | null;
}

export class FacultyCollaborationService {
  /**
   * Helper: Resolve user role and profile
   */
  private async getUserProfile(userId: string) {
    const res = await db.query(
      `SELECT p.id, p.full_name, u.role, p.institution_id
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.id = $1`,
      [userId]
    );
    if (res.rows.length === 0) {
      throw new AppError("User profile record not found", 404);
    }
    return res.rows[0];
  }

  // ===========================================================================
  // OPPORTUNITIES: DISCOVERY & DETAIL
  // ===========================================================================

  /**
   * List Published Opportunities (Authenticated cross-platform discovery)
   * Open to authenticated faculty, institution, industry roles.
   * Excludes draft opportunities (unless authored by caller).
   */
  async listOpportunities(
    callerUserId: string,
    filters?: {
      opportunityType?: string;
      mode?: string;
    }
  ): Promise<FacultyOpportunitySummary[]> {
    const profile = await this.getUserProfile(callerUserId);
    if (!["faculty", "institution", "industry"].includes(profile.role)) {
      throw new AppError("Unauthorized: Role not eligible for faculty collaboration discovery.", 403);
    }

    let sql = `
      SELECT o.id, o.title, o.description, o.opportunity_type, o.provider_name,
             o.location, o.mode, o.start_date, o.end_date, o.application_deadline,
             o.external_url, o.status, o.organization_id, o.created_by, o.created_at, o.updated_at,
             org.name AS organization_name,
             i.status AS my_interest_status
      FROM public.faculty_opportunities o
      LEFT JOIN public.organizations org ON o.organization_id = org.id
      LEFT JOIN public.faculty_opportunity_interests i
             ON o.id = i.opportunity_id AND i.faculty_id = $1
      WHERE o.status = 'published'
    `;
    const params: any[] = [callerUserId];

    if (filters?.opportunityType) {
      params.push(filters.opportunityType);
      sql += ` AND o.opportunity_type = $${params.length}`;
    }

    if (filters?.mode) {
      params.push(filters.mode);
      sql += ` AND o.mode = $${params.length}`;
    }

    sql += ` ORDER BY o.created_at DESC`;

    const res = await db.query(sql, params);

    return res.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      opportunityType: r.opportunity_type,
      providerName: r.provider_name,
      location: r.location,
      mode: r.mode,
      startDate: r.start_date,
      endDate: r.end_date,
      applicationDeadline: r.application_deadline,
      externalUrl: r.external_url,
      status: r.status,
      organizationId: r.organization_id,
      organizationName: r.organization_name || null,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      myInterestStatus: r.my_interest_status || null,
    }));
  }

  /**
   * Get Opportunity Detail
   */
  async getOpportunityDetail(callerUserId: string, opportunityId: string) {
    const profile = await this.getUserProfile(callerUserId);
    if (!["faculty", "institution", "industry"].includes(profile.role)) {
      throw new AppError("Unauthorized: Role not eligible for faculty collaboration.", 403);
    }

    const res = await db.query(
      `SELECT o.id, o.title, o.description, o.opportunity_type, o.provider_name,
              o.location, o.mode, o.start_date, o.end_date, o.application_deadline,
              o.external_url, o.status, o.organization_id, o.created_by, o.created_at, o.updated_at,
              org.name AS organization_name,
              i.id AS my_interest_id, i.status AS my_interest_status, i.message AS my_interest_message,
              i.created_at AS my_interest_created_at
       FROM public.faculty_opportunities o
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       LEFT JOIN public.faculty_opportunity_interests i
              ON o.id = i.opportunity_id AND i.faculty_id = $1
       WHERE o.id = $2`,
      [callerUserId, opportunityId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }

    const r = res.rows[0];

    // If opportunity is not published, only the creator can view it
    if (r.status !== "published" && r.created_by !== callerUserId) {
      throw new AppError("Opportunity not found", 404);
    }

    const isOwner = r.created_by === callerUserId;
    let applicantCount = 0;

    if (isOwner) {
      const countRes = await db.query(
        `SELECT COUNT(*)::int AS count FROM public.faculty_opportunity_interests WHERE opportunity_id = $1`,
        [opportunityId]
      );
      applicantCount = countRes.rows[0].count;
    }

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      opportunityType: r.opportunity_type,
      providerName: r.provider_name,
      location: r.location,
      mode: r.mode,
      startDate: r.start_date,
      endDate: r.end_date,
      applicationDeadline: r.application_deadline,
      externalUrl: r.external_url,
      status: r.status,
      organizationId: r.organization_id,
      organizationName: r.organization_name || null,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      isOwner,
      applicantCount: isOwner ? applicantCount : undefined,
      myInterest: r.my_interest_id
        ? {
            id: r.my_interest_id,
            status: r.my_interest_status,
            message: r.my_interest_message,
            createdAt: r.my_interest_created_at,
          }
        : null,
    };
  }

  // ===========================================================================
  // OPPORTUNITY AUTHORSHIP (CREATOR WORKFLOW)
  // ===========================================================================

  /**
   * List Authored Opportunities
   */
  async listMyAuthoredOpportunities(authorUserId: string) {
    const res = await db.query(
      `SELECT o.id, o.title, o.description, o.opportunity_type, o.provider_name,
              o.mode, o.start_date, o.end_date, o.application_deadline, o.status,
              o.created_at, o.updated_at,
              COUNT(i.id)::int AS applicant_count
       FROM public.faculty_opportunities o
       LEFT JOIN public.faculty_opportunity_interests i ON o.id = i.opportunity_id
       WHERE o.created_by = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [authorUserId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      opportunityType: r.opportunity_type,
      providerName: r.provider_name,
      mode: r.mode,
      startDate: r.start_date,
      endDate: r.end_date,
      applicationDeadline: r.application_deadline,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      applicantCount: r.applicant_count,
    }));
  }

  /**
   * Create Opportunity
   * Allowed roles: faculty, institution, industry.
   * created_by is derived strictly from JWT.
   * organization_id remains NULL unless verified industry organization.
   */
  async createOpportunity(authorUserId: string, input: CreateFacultyOpportunityInput) {
    const profile = await this.getUserProfile(authorUserId);
    if (!["faculty", "institution", "industry"].includes(profile.role)) {
      throw new AppError("Only faculty, institution, and industry accounts can create opportunities.", 403);
    }

    // Explicitly keeping organization_id NULL in Module 5 to avoid premature cross-module coupling
    // provider_name captures the academic or industry sponsoring entity cleanly
    const insertRes = await db.query(
      `INSERT INTO public.faculty_opportunities (
         created_by, title, description, opportunity_type, provider_name,
         location, mode, start_date, end_date, application_deadline,
         external_url, status, organization_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NULL)
       RETURNING id, title, opportunity_type, status, created_at`,
      [
        authorUserId,
        input.title.trim(),
        input.description.trim(),
        input.opportunityType,
        input.providerName ? input.providerName.trim() : null,
        input.location ? input.location.trim() : null,
        input.mode || null,
        input.startDate || null,
        input.endDate || null,
        input.applicationDeadline || null,
        input.externalUrl ? input.externalUrl.trim() : null,
        input.status || "draft",
      ]
    );

    return insertRes.rows[0];
  }

  /**
   * Update Opportunity Metadata (Owner only)
   */
  async updateOpportunityMetadata(
    authorUserId: string,
    opportunityId: string,
    input: UpdateFacultyOpportunityInput
  ) {
    const oppRes = await db.query(
      `SELECT id, created_by, status FROM public.faculty_opportunities WHERE id = $1`,
      [opportunityId]
    );
    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }
    if (oppRes.rows[0].created_by !== authorUserId) {
      throw new AppError("Unauthorized: Only the opportunity creator can edit metadata.", 403);
    }
    if (oppRes.rows[0].status === "archived") {
      throw new AppError("Cannot edit an archived opportunity.", 400);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
      params.push(input.title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (input.description !== undefined) {
      params.push(input.description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (input.opportunityType !== undefined) {
      params.push(input.opportunityType);
      updates.push(`opportunity_type = $${params.length}`);
    }
    if (input.providerName !== undefined) {
      params.push(input.providerName ? input.providerName.trim() : null);
      updates.push(`provider_name = $${params.length}`);
    }
    if (input.location !== undefined) {
      params.push(input.location ? input.location.trim() : null);
      updates.push(`location = $${params.length}`);
    }
    if (input.mode !== undefined) {
      params.push(input.mode || null);
      updates.push(`mode = $${params.length}`);
    }
    if (input.startDate !== undefined) {
      params.push(input.startDate || null);
      updates.push(`start_date = $${params.length}`);
    }
    if (input.endDate !== undefined) {
      params.push(input.endDate || null);
      updates.push(`end_date = $${params.length}`);
    }
    if (input.applicationDeadline !== undefined) {
      params.push(input.applicationDeadline || null);
      updates.push(`application_deadline = $${params.length}`);
    }
    if (input.externalUrl !== undefined) {
      params.push(input.externalUrl ? input.externalUrl.trim() : null);
      updates.push(`external_url = $${params.length}`);
    }

    if (updates.length === 0) {
      return oppRes.rows[0];
    }

    params.push(opportunityId);
    const updateRes = await db.query(
      `UPDATE public.faculty_opportunities
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING id, title, description, opportunity_type, status, updated_at`,
      params
    );

    return updateRes.rows[0];
  }

  /**
   * Update Opportunity Status (Owner only)
   * Enforces status progression: draft -> published -> closed -> archived.
   * Archived is terminal. Closed can return to published.
   */
  async updateOpportunityStatus(
    authorUserId: string,
    opportunityId: string,
    input: UpdateFacultyOpportunityStatusInput
  ) {
    const oppRes = await db.query(
      `SELECT id, created_by, status FROM public.faculty_opportunities WHERE id = $1`,
      [opportunityId]
    );
    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }
    if (oppRes.rows[0].created_by !== authorUserId) {
      throw new AppError("Unauthorized: Only the opportunity creator can change status.", 403);
    }

    const currentStatus = oppRes.rows[0].status;
    const newStatus = input.status;

    if (currentStatus === newStatus) {
      return oppRes.rows[0];
    }

    // Terminal check
    if (currentStatus === "archived") {
      throw new AppError("Invalid transition: An archived opportunity cannot be modified.", 400);
    }

    // Valid transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["published", "archived"],
      published: ["closed", "archived"],
      closed: ["published", "archived"],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        400
      );
    }

    const updateRes = await db.query(
      `UPDATE public.faculty_opportunities
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, title, status, updated_at`,
      [newStatus, opportunityId]
    );

    return updateRes.rows[0];
  }

  // ===========================================================================
  // COLLABORATION INTERESTS (APPLICANT & OWNER WORKFLOWS)
  // ===========================================================================

  /**
   * List Faculty Member's Submitted Interests
   */
  async listMyInterests(facultyUserId: string) {
    const res = await db.query(
      `SELECT i.id, i.status, i.message, i.created_at, i.updated_at,
              o.id AS opportunity_id, o.title, o.opportunity_type, o.provider_name,
              o.location, o.mode, o.start_date, o.end_date, o.application_deadline,
              o.status AS opportunity_status
       FROM public.faculty_opportunity_interests i
       JOIN public.faculty_opportunities o ON i.opportunity_id = o.id
       WHERE i.faculty_id = $1
       ORDER BY i.created_at DESC`,
      [facultyUserId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      opportunity: {
        id: r.opportunity_id,
        title: r.title,
        opportunityType: r.opportunity_type,
        providerName: r.provider_name,
        location: r.location,
        mode: r.mode,
        startDate: r.start_date,
        endDate: r.end_date,
        applicationDeadline: r.application_deadline,
        status: r.opportunity_status,
      },
    }));
  }

  /**
   * Express Interest in a Published Opportunity
   * Caller must have role = 'faculty'.
   * Opportunity must have status = 'published'.
   */
  async expressInterest(facultyUserId: string, opportunityId: string, input: ExpressFacultyInterestInput) {
    const profile = await this.getUserProfile(facultyUserId);
    if (profile.role !== "faculty") {
      throw new AppError("Only faculty members can express interest in collaboration programs.", 403);
    }

    const oppRes = await db.query(
      `SELECT id, status, title FROM public.faculty_opportunities WHERE id = $1`,
      [opportunityId]
    );
    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }
    if (oppRes.rows[0].status !== "published") {
      throw new AppError("Expressions of interest can only be submitted to published opportunities.", 400);
    }

    // Check existing
    const existing = await db.query(
      `SELECT id, status FROM public.faculty_opportunity_interests
       WHERE opportunity_id = $1 AND faculty_id = $2`,
      [opportunityId, facultyUserId]
    );
    if (existing.rows.length > 0) {
      throw new AppError("You have already expressed interest in this opportunity.", 409);
    }

    const insertRes = await db.query(
      `INSERT INTO public.faculty_opportunity_interests (
         opportunity_id, faculty_id, message, status
       ) VALUES ($1, $2, $3, 'interested')
       RETURNING id, opportunity_id, faculty_id, status, message, created_at`,
      [opportunityId, facultyUserId, input.message ? input.message.trim() : null]
    );

    return insertRes.rows[0];
  }

  /**
   * Update Statement Message (Applicant only, while status = 'interested')
   */
  async updateInterestMessage(
    facultyUserId: string,
    interestId: string,
    input: UpdateFacultyInterestMessageInput
  ) {
    const intRes = await db.query(
      `SELECT id, faculty_id, status FROM public.faculty_opportunity_interests WHERE id = $1`,
      [interestId]
    );
    if (intRes.rows.length === 0) {
      throw new AppError("Interest submission not found", 404);
    }
    if (intRes.rows[0].faculty_id !== facultyUserId) {
      throw new AppError("Unauthorized: You can only edit your own submission message.", 403);
    }
    if (intRes.rows[0].status !== "interested") {
      throw new AppError("Statement message cannot be modified once interest is under review or decided.", 400);
    }

    const updateRes = await db.query(
      `UPDATE public.faculty_opportunity_interests
       SET message = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, message, updated_at`,
      [input.message.trim(), interestId]
    );

    return updateRes.rows[0];
  }

  /**
   * Withdraw Interest (Applicant only, while status = 'interested' or 'under_review')
   */
  async withdrawInterest(facultyUserId: string, interestId: string) {
    const intRes = await db.query(
      `SELECT id, faculty_id, status FROM public.faculty_opportunity_interests WHERE id = $1`,
      [interestId]
    );
    if (intRes.rows.length === 0) {
      throw new AppError("Interest submission not found", 404);
    }
    if (intRes.rows[0].faculty_id !== facultyUserId) {
      throw new AppError("Unauthorized: You can only withdraw your own submissions.", 403);
    }

    const currentStatus = intRes.rows[0].status;
    if (!["interested", "under_review"].includes(currentStatus)) {
      throw new AppError("Cannot withdraw interest after it has been accepted or rejected.", 400);
    }

    const updateRes = await db.query(
      `UPDATE public.faculty_opportunity_interests
       SET status = 'withdrawn', updated_at = NOW()
       WHERE id = $1
       RETURNING id, status, updated_at`,
      [interestId]
    );

    return updateRes.rows[0];
  }

  /**
   * List Applicants for Opportunity (Opportunity creator only)
   */
  async listOpportunityApplicants(authorUserId: string, opportunityId: string) {
    const oppRes = await db.query(
      `SELECT id, created_by, title FROM public.faculty_opportunities WHERE id = $1`,
      [opportunityId]
    );
    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }
    if (oppRes.rows[0].created_by !== authorUserId) {
      throw new AppError("Unauthorized: Only the opportunity creator can review applicant submissions.", 403);
    }

    const res = await db.query(
      `SELECT i.id, i.status, i.message, i.created_at, i.updated_at,
              p.id AS faculty_id, p.full_name AS faculty_name, u.email AS faculty_email,
              p.department, inst.name AS institution_name, inst.code AS institution_code
       FROM public.faculty_opportunity_interests i
       JOIN public.profiles p ON i.faculty_id = p.id
       JOIN public.users u ON p.id = u.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE i.opportunity_id = $1
       ORDER BY i.created_at DESC`,
      [opportunityId]
    );

    return {
      opportunity: {
        id: oppRes.rows[0].id,
        title: oppRes.rows[0].title,
      },
      applicants: res.rows.map((r: any) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        faculty: {
          id: r.faculty_id,
          fullName: r.faculty_name,
          email: r.faculty_email,
          department: r.department || null,
          institutionName: r.institution_name || null,
          institutionCode: r.institution_code || null,
        },
      })),
    };
  }

  /**
   * Update Applicant Status (Opportunity creator only)
   * Enforced state machine:
   * interested -> under_review
   * under_review -> accepted / rejected
   */
  async updateApplicantStatus(
    authorUserId: string,
    interestId: string,
    input: UpdateFacultyInterestStatusInput
  ) {
    const intRes = await db.query(
      `SELECT i.id, i.status, i.opportunity_id, o.created_by
       FROM public.faculty_opportunity_interests i
       JOIN public.faculty_opportunities o ON i.opportunity_id = o.id
       WHERE i.id = $1`,
      [interestId]
    );

    if (intRes.rows.length === 0) {
      throw new AppError("Interest submission not found", 404);
    }

    if (intRes.rows[0].created_by !== authorUserId) {
      throw new AppError("Unauthorized: Only the opportunity creator can update applicant review status.", 403);
    }

    const currentStatus = intRes.rows[0].status;
    const newStatus = input.status;

    if (currentStatus === newStatus) {
      return intRes.rows[0];
    }

    // State machine check
    let valid = false;
    if (currentStatus === "interested" && newStatus === "under_review") {
      valid = true;
    } else if (currentStatus === "under_review" && ["accepted", "rejected"].includes(newStatus)) {
      valid = true;
    }

    if (!valid) {
      throw new AppError(
        `Invalid status transition: Cannot transition applicant status from '${currentStatus}' to '${newStatus}'.`,
        400
      );
    }

    const updateRes = await db.query(
      `UPDATE public.faculty_opportunity_interests
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [newStatus, interestId]
    );

    return updateRes.rows[0];
  }
}

export const facultyCollaborationService = new FacultyCollaborationService();
