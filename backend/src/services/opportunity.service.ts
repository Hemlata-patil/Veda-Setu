import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import {
  calculateOpportunitySkillMatch,
  OpportunityCompetencyRequirement,
  OpportunitySkillMatchResult,
} from "./matching.service";
import { CreateOpportunityInput, UpdateOpportunityInput } from "../utils/validation";

export interface OpportunityWithCompetencies {
  id: string;
  organization_id: string | null;
  organization_name?: string | null;
  created_by: string | null;
  title: string;
  description: string;
  opportunity_type: string;
  location: string | null;
  work_mode: string | null;
  eligibility: string | null;
  application_deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  requirements: OpportunityCompetencyRequirement[];
  matchResult?: OpportunitySkillMatchResult;
  hasApplied?: boolean;
  application?: { id: string; status: string; applied_at: string } | null;
}

export class OpportunityService {
  /**
   * Student: List published opportunities with real-time skill matching
   * using DB-verified student competencies.
   */
  async getPublishedOpportunitiesForStudent(
    studentUserId: string
  ): Promise<OpportunityWithCompetencies[]> {
    // 1. Fetch student's assessed competencies from DB (Never trust client input)
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

    // 2. Fetch existing applications by this student to flag hasApplied
    const studentAppsRes = await db.query(
      `SELECT opportunity_id FROM public.applications WHERE student_id = $1`,
      [studentUserId]
    );
    const appliedOppIds = new Set(studentAppsRes.rows.map((r: any) => r.opportunity_id));

    // 3. Fetch all PUBLISHED opportunities + organization info
    const oppsRes = await db.query(
      `SELECT o.*, org.name AS organization_name
       FROM public.opportunities o
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       WHERE o.status = 'published'
       ORDER BY o.created_at DESC`
    );

    const oppRows = oppsRes.rows;
    if (oppRows.length === 0) {
      return [];
    }

    const oppIds = oppRows.map((r: any) => r.id);

    // 4. Fetch competency requirements for these published opportunities
    const compReqsRes = await db.query(
      `SELECT oc.opportunity_id, oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = ANY($1::uuid[])
       ORDER BY c.name ASC`,
      [oppIds]
    );

    const requirementsByOpp = new Map<string, OpportunityCompetencyRequirement[]>();
    for (const reqRow of compReqsRes.rows) {
      const list = requirementsByOpp.get(reqRow.opportunity_id) || [];
      list.push({
        competencyId: reqRow.competency_id,
        competencyName: reqRow.competency_name,
        category: reqRow.category,
        requiredScore: Number(reqRow.required_score),
        weight: Number(reqRow.weight),
      });
      requirementsByOpp.set(reqRow.opportunity_id, list);
    }

    // 5. Calculate skill match for each opportunity
    return oppRows.map((opp: any) => {
      const requirements = requirementsByOpp.get(opp.id) || [];
      const matchResult = calculateOpportunitySkillMatch(requirements, studentScoresMap);

      return {
        ...opp,
        requirements,
        matchResult,
        hasApplied: appliedOppIds.has(opp.id),
      };
    });
  }

  /**
   * Student: Get single published opportunity details with skill match
   */
  async getPublishedOpportunityDetail(
    opportunityId: string,
    studentUserId: string
  ): Promise<OpportunityWithCompetencies> {
    const oppRes = await db.query(
      `SELECT o.*, org.name AS organization_name
       FROM public.opportunities o
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       WHERE o.id = $1 AND o.status = 'published'`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found or not published", 404);
    }

    const opp = oppRes.rows[0];

    // Fetch requirements
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

    // Fetch student's assessed competencies from DB
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

    // Check if student applied
    const appRes = await db.query(
      `SELECT id, status, applied_at FROM public.applications
       WHERE opportunity_id = $1 AND student_id = $2`,
      [opportunityId, studentUserId]
    );

    const matchResult = calculateOpportunitySkillMatch(requirements, studentScoresMap);

    return {
      ...opp,
      requirements,
      matchResult,
      hasApplied: appRes.rows.length > 0,
      application: appRes.rows[0] || null,
    };
  }

  /**
   * Industry: List opportunities created by the authenticated industry user
   */
  async getIndustryOpportunities(industryUserId: string): Promise<OpportunityWithCompetencies[]> {
    const oppsRes = await db.query(
      `SELECT o.*, org.name AS organization_name,
              COUNT(a.id)::int AS applicant_count
       FROM public.opportunities o
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       LEFT JOIN public.applications a ON o.id = a.opportunity_id
       WHERE o.created_by = $1
       GROUP BY o.id, org.name
       ORDER BY o.created_at DESC`,
      [industryUserId]
    );

    const oppRows = oppsRes.rows;
    if (oppRows.length === 0) return [];

    const oppIds = oppRows.map((r: any) => r.id);

    const compReqsRes = await db.query(
      `SELECT oc.opportunity_id, oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = ANY($1::uuid[])
       ORDER BY c.name ASC`,
      [oppIds]
    );

    const requirementsByOpp = new Map<string, OpportunityCompetencyRequirement[]>();
    for (const reqRow of compReqsRes.rows) {
      const list = requirementsByOpp.get(reqRow.opportunity_id) || [];
      list.push({
        competencyId: reqRow.competency_id,
        competencyName: reqRow.competency_name,
        category: reqRow.category,
        requiredScore: Number(reqRow.required_score),
        weight: Number(reqRow.weight),
      });
      requirementsByOpp.set(reqRow.opportunity_id, list);
    }

    return oppRows.map((opp: any) => ({
      ...opp,
      requirements: requirementsByOpp.get(opp.id) || [],
    }));
  }

  /**
   * Industry: Get single opportunity created by this industry user
   */
  async getIndustryOpportunityDetail(
    opportunityId: string,
    industryUserId: string
  ): Promise<OpportunityWithCompetencies> {
    const oppRes = await db.query(
      `SELECT o.*, org.name AS organization_name
       FROM public.opportunities o
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       WHERE o.id = $1`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }

    const opp = oppRes.rows[0];
    if (opp.created_by !== industryUserId) {
      throw new AppError("Access denied. You do not own this opportunity.", 403);
    }

    const compReqsRes = await db.query(
      `SELECT oc.competency_id, oc.required_score, oc.weight,
              c.name AS competency_name, c.category
       FROM public.opportunity_competencies oc
       JOIN public.competencies c ON oc.competency_id = c.id
       WHERE oc.opportunity_id = $1
       ORDER BY c.name ASC`,
      [opportunityId]
    );

    const requirements = compReqsRes.rows.map((r: any) => ({
      competencyId: r.competency_id,
      competencyName: r.competency_name,
      category: r.category,
      requiredScore: Number(r.required_score),
      weight: Number(r.weight),
    }));

    return {
      ...opp,
      requirements,
    };
  }

  /**
   * Industry: Create opportunity with required competencies in an atomic transaction
   */
  async createOpportunity(
    industryUserId: string,
    data: CreateOpportunityInput
  ): Promise<{ opportunityId: string }> {
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Optional organization resolution
      let organizationId: string | null = null;
      if (data.organizationName && data.organizationName.trim()) {
        const orgName = data.organizationName.trim();
        const existingOrgRes = await client.query(
          `SELECT id FROM public.organizations WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [orgName]
        );

        if (existingOrgRes.rows.length > 0) {
          organizationId = existingOrgRes.rows[0].id;
        } else {
          const newOrgRes = await client.query(
            `INSERT INTO public.organizations (name, organization_type, location)
             VALUES ($1, 'Ayush Industry Partner', $2)
             RETURNING id`,
            [orgName, data.location || null]
          );
          organizationId = newOrgRes.rows[0].id;
        }
      }

      // 1. Insert Opportunity
      const insertOppSql = `
        INSERT INTO public.opportunities (
          organization_id,
          created_by,
          title,
          description,
          opportunity_type,
          location,
          work_mode,
          eligibility,
          application_deadline,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const insertOppRes = await client.query(insertOppSql, [
        organizationId,
        industryUserId,
        data.title,
        data.description,
        data.opportunityType,
        data.location || null,
        data.workMode || null,
        data.eligibility || null,
        data.applicationDeadline || null,
        data.status || "draft",
      ]);

      const opportunityId = insertOppRes.rows[0].id;

      // 2. Insert Required Competencies (if any)
      if (data.requiredCompetencies && data.requiredCompetencies.length > 0) {
        for (const req of data.requiredCompetencies) {
          await client.query(
            `INSERT INTO public.opportunity_competencies (
              opportunity_id,
              competency_id,
              required_score,
              weight
            ) VALUES ($1, $2, $3, $4)`,
            [
              opportunityId,
              req.competencyId,
              Math.min(100, Math.max(0, req.requiredScore)),
              req.weight && req.weight > 0 ? req.weight : 1,
            ]
          );
        }
      }

      await client.query("COMMIT");
      return { opportunityId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Industry: Update opportunity and its competencies in an atomic transaction
   */
  async updateOpportunity(
    opportunityId: string,
    industryUserId: string,
    data: UpdateOpportunityInput
  ): Promise<{ success: boolean }> {
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Verify existence & ownership
      const checkRes = await client.query(
        `SELECT id, created_by, status FROM public.opportunities WHERE id = $1 FOR UPDATE`,
        [opportunityId]
      );

      if (checkRes.rows.length === 0) {
        throw new AppError("Opportunity not found", 404);
      }

      const existingOpp = checkRes.rows[0];
      if (existingOpp.created_by !== industryUserId) {
        throw new AppError("Access denied. You do not own this opportunity.", 403);
      }

      // Check status transition if status is being updated
      if (data.status && data.status !== existingOpp.status) {
        this.assertValidOpportunityStatusTransition(existingOpp.status, data.status);
      }

      // Update fields
      const updateFields: string[] = [];
      const updateParams: any[] = [];
      let paramIdx = 1;

      if (data.title !== undefined) {
        updateFields.push(`title = $${paramIdx++}`);
        updateParams.push(data.title);
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIdx++}`);
        updateParams.push(data.description);
      }
      if (data.opportunityType !== undefined) {
        updateFields.push(`opportunity_type = $${paramIdx++}`);
        updateParams.push(data.opportunityType);
      }
      if (data.location !== undefined) {
        updateFields.push(`location = $${paramIdx++}`);
        updateParams.push(data.location);
      }
      if (data.workMode !== undefined) {
        updateFields.push(`work_mode = $${paramIdx++}`);
        updateParams.push(data.workMode);
      }
      if (data.eligibility !== undefined) {
        updateFields.push(`eligibility = $${paramIdx++}`);
        updateParams.push(data.eligibility);
      }
      if (data.applicationDeadline !== undefined) {
        updateFields.push(`application_deadline = $${paramIdx++}`);
        updateParams.push(data.applicationDeadline);
      }
      if (data.status !== undefined) {
        updateFields.push(`status = $${paramIdx++}`);
        updateParams.push(data.status);
      }

      if (updateFields.length > 0) {
        updateParams.push(opportunityId);
        await client.query(
          `UPDATE public.opportunities SET ${updateFields.join(", ")} WHERE id = $${paramIdx}`,
          updateParams
        );
      }

      // If competencies were supplied, replace them atomically
      if (data.requiredCompetencies !== undefined) {
        await client.query(
          `DELETE FROM public.opportunity_competencies WHERE opportunity_id = $1`,
          [opportunityId]
        );

        for (const req of data.requiredCompetencies) {
          await client.query(
            `INSERT INTO public.opportunity_competencies (
              opportunity_id,
              competency_id,
              required_score,
              weight
            ) VALUES ($1, $2, $3, $4)`,
            [
              opportunityId,
              req.competencyId,
              Math.min(100, Math.max(0, req.requiredScore)),
              req.weight && req.weight > 0 ? req.weight : 1,
            ]
          );
        }
      }

      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Industry: Update opportunity status
   */
  async updateOpportunityStatus(
    opportunityId: string,
    industryUserId: string,
    newStatus: string
  ): Promise<{ success: boolean }> {
    const oppRes = await db.query(
      `SELECT id, created_by, status FROM public.opportunities WHERE id = $1`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }

    const opp = oppRes.rows[0];
    if (opp.created_by !== industryUserId) {
      throw new AppError("Access denied. You do not own this opportunity.", 403);
    }

    this.assertValidOpportunityStatusTransition(opp.status, newStatus);

    await db.query(`UPDATE public.opportunities SET status = $1 WHERE id = $2`, [
      newStatus,
      opportunityId,
    ]);

    return { success: true };
  }

  /**
   * Industry: Delete opportunity (cascade deletes opportunity_competencies, restricts if applications exist)
   */
  async deleteOpportunity(
    opportunityId: string,
    industryUserId: string
  ): Promise<{ success: boolean }> {
    const oppRes = await db.query(
      `SELECT id, created_by FROM public.opportunities WHERE id = $1`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      throw new AppError("Opportunity not found", 404);
    }

    if (oppRes.rows[0].created_by !== industryUserId) {
      throw new AppError("Access denied. You do not own this opportunity.", 403);
    }

    // Check if applications exist
    const appsRes = await db.query(
      `SELECT COUNT(*)::int AS count FROM public.applications WHERE opportunity_id = $1`,
      [opportunityId]
    );

    if (appsRes.rows[0].count > 0) {
      throw new AppError(
        "Cannot delete opportunity with existing candidate applications. Archive or close it instead.",
        400
      );
    }

    await db.query(`DELETE FROM public.opportunities WHERE id = $1`, [opportunityId]);
    return { success: true };
  }

  /**
   * Helper: Validate opportunity status transitions
   * Allowed transitions:
   * - draft <-> published
   * - published -> closed
   * - closed -> archived
   * - closed -> published (re-opening allowed)
   * Terminal state: archived cannot be changed
   */
  private assertValidOpportunityStatusTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === newStatus) return;

    if (currentStatus === "archived") {
      throw new AppError(
        `Opportunity in 'archived' status is terminal and cannot be transitioned to '${newStatus}'.`,
        400
      );
    }

    const allowedTransitions: Record<string, string[]> = {
      draft: ["published"],
      published: ["draft", "closed"],
      closed: ["published", "archived"],
    };

    const validTargets = allowedTransitions[currentStatus] || [];
    if (!validTargets.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        400
      );
    }
  }
}

export const opportunityService = new OpportunityService();
