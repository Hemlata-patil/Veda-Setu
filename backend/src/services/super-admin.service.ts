import bcrypt from "bcryptjs";
import { db } from "../db";
import { AppError } from "../middleware/error.middleware";

export interface CreateInstitutionAdminInput {
  name: string;
  code?: string;
  category?: string;
  location?: string;
  adminFullName: string;
  adminEmail: string;
  temporaryPassword: string;
}

export interface CreateIndustryAdminInput {
  name: string;
  organizationType?: string;
  location?: string;
  contactFullName: string;
  contactEmail: string;
  temporaryPassword: string;
}

export class SuperAdminService {
  /**
   * Super Admin Dashboard: Aggregates platform-wide metrics & recent activity
   */
  async getDashboard() {
    const [
      studentsRes,
      facultyRes,
      instRes,
      orgRes,
      oppsRes,
      appsRes,
      selAppsRes,
      placementsRes,
      recentOppsRes,
      recentAppsRes,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM public.users WHERE role = 'student'`),
      db.query(`SELECT COUNT(*)::int AS count FROM public.users WHERE role = 'faculty'`),
      db.query(`SELECT COUNT(*)::int AS count FROM public.institutions`),
      db.query(`SELECT COUNT(*)::int AS count FROM public.organizations`),
      db.query(`SELECT COUNT(*)::int AS count FROM public.opportunities WHERE status = 'published'`),
      db.query(`SELECT COUNT(*)::int AS count FROM public.applications`),
      db.query(`SELECT COUNT(*)::int AS count FROM public.applications WHERE status = 'selected'`),
      db.query(
        `SELECT COUNT(*)::int AS count FROM public.internship_placements WHERE status IN ('joined', 'in_progress')`
      ),
      db.query(
        `SELECT o.id, o.title, o.opportunity_type, o.status, o.created_at,
                org.name AS organization_name
         FROM public.opportunities o
         LEFT JOIN public.organizations org ON o.organization_id = org.id
         ORDER BY o.created_at DESC
         LIMIT 5`
      ),
      db.query(
        `SELECT a.id, a.status, a.applied_at,
                p.full_name AS student_name,
                o.title AS opportunity_title
         FROM public.applications a
         LEFT JOIN public.profiles p ON a.student_id = p.id
         LEFT JOIN public.opportunities o ON a.opportunity_id = o.id
         ORDER BY a.applied_at DESC
         LIMIT 5`
      ),
    ]);

    const metrics = {
      totalStudents: Number(studentsRes.rows[0]?.count || 0),
      totalFaculty: Number(facultyRes.rows[0]?.count || 0),
      totalInstitutions: Number(instRes.rows[0]?.count || 0),
      totalOrganizations: Number(orgRes.rows[0]?.count || 0),
      publishedOpportunities: Number(oppsRes.rows[0]?.count || 0),
      totalApplications: Number(appsRes.rows[0]?.count || 0),
      selectedCandidates: Number(selAppsRes.rows[0]?.count || 0),
      activePlacements: Number(placementsRes.rows[0]?.count || 0),
    };

    const recentOpportunities = recentOppsRes.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      opportunity_type: row.opportunity_type,
      status: row.status,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      organizations: row.organization_name ? { name: row.organization_name } : null,
    }));

    const recentApplications = recentAppsRes.rows.map((row: any) => ({
      id: row.id,
      status: row.status,
      applied_at: row.applied_at ? new Date(row.applied_at).toISOString() : new Date().toISOString(),
      student: row.student_name ? { full_name: row.student_name } : null,
      opportunity: row.opportunity_title ? { title: row.opportunity_title } : null,
    }));

    return {
      metrics,
      recentOpportunities,
      recentApplications,
    };
  }

  /**
   * Super Admin Institutions: List all institutions with student and faculty counts
   */
  async getInstitutions() {
    const res = await db.query(
      `SELECT i.id, i.name, i.code, i.category, i.location, i.verification_status, i.created_at,
              COUNT(DISTINCT CASE WHEN u.role = 'student' THEN p.id END)::int AS "studentCount",
              COUNT(DISTINCT CASE WHEN u.role = 'faculty' THEN p.id END)::int AS "facultyCount"
       FROM public.institutions i
       LEFT JOIN public.profiles p ON p.institution_id = i.id
       LEFT JOIN public.users u ON p.id = u.id
       GROUP BY i.id, i.name, i.code, i.category, i.location, i.verification_status, i.created_at
       ORDER BY i.name ASC`
    );

    const institutions = res.rows.map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      code: inst.code,
      category: inst.category || "Ayurveda College",
      location: inst.location || "India",
      verification_status: inst.verification_status || "approved",
      created_at: inst.created_at ? new Date(inst.created_at).toISOString() : new Date().toISOString(),
      studentCount: Number(inst.studentCount || 0),
      facultyCount: Number(inst.facultyCount || 0),
    }));

    return { institutions };
  }

  /**
   * Super Admin Institutions: Atomically create an institution and provision admin account
   */
  async createInstitutionWithAdmin(input: CreateInstitutionAdminInput) {
    const name = input.name?.trim();
    const code = input.code?.trim() ? input.code.trim().toUpperCase() : null;
    const category = input.category?.trim() || "Ayurveda College";
    const location = input.location?.trim() || "India";
    const adminFullName = input.adminFullName?.trim();
    const adminEmail = input.adminEmail?.trim().toLowerCase();
    const temporaryPassword = input.temporaryPassword;

    if (!name) throw new AppError("Institution name is required.", 400);
    if (!adminFullName) throw new AppError("Administrator full name is required.", 400);
    if (!adminEmail || !adminEmail.includes("@")) throw new AppError("Valid administrator email is required.", 400);
    if (!temporaryPassword || temporaryPassword.length < 6) {
      throw new AppError("Temporary password must be at least 6 characters long.", 400);
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Check code uniqueness if provided
      if (code) {
        const codeCheck = await client.query(
          `SELECT id FROM public.institutions WHERE code = $1 LIMIT 1`,
          [code]
        );
        if (codeCheck.rows.length > 0) {
          throw new AppError(`An institution with code '${code}' already exists.`, 409);
        }
      }

      // Check email uniqueness in users table
      const emailCheck = await client.query(
        `SELECT id FROM public.users WHERE email = $1 LIMIT 1`,
        [adminEmail]
      );
      if (emailCheck.rows.length > 0) {
        throw new AppError(`An account with email '${adminEmail}' already exists.`, 409);
      }

      // 1. Create Institution
      const instRes = await client.query(
        `INSERT INTO public.institutions (name, code, category, location, verification_status)
         VALUES ($1, $2, $3, $4, 'approved')
         RETURNING id, name, code`,
        [name, code, category, location]
      );
      const newInst = instRes.rows[0];

      // 2. Hash temporary password
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      // 3. Create User record
      const userRes = await client.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'institution')
         RETURNING id`,
        [adminEmail, passwordHash]
      );
      const authUserId = userRes.rows[0].id;

      // 4. Create Profile linked to the newly created institution
      await client.query(
        `INSERT INTO public.profiles (id, full_name, institution_id, organization_id)
         VALUES ($1, $2, $3, NULL)`,
        [authUserId, adminFullName, newInst.id]
      );

      await client.query("COMMIT");

      return {
        success: true,
        institutionId: newInst.id,
        institutionName: newInst.name,
        userId: authUserId,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Super Admin Institutions: Update verification status
   */
  async updateInstitutionStatus(institutionId: string, status: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(institutionId)) {
      throw new AppError("Invalid institution ID format.", 400);
    }

    const allowed = ["pending", "approved", "rejected", "suspended"];
    if (!allowed.includes(status)) {
      throw new AppError(`Invalid verification status '${status}'. Allowed: ${allowed.join(", ")}`, 400);
    }

    const res = await db.query(
      `UPDATE public.institutions
       SET verification_status = $1
       WHERE id = $2
       RETURNING id, name, code, verification_status`,
      [status, institutionId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Institution not found.", 404);
    }

    return {
      success: true,
      institution: res.rows[0],
    };
  }

  /**
   * Super Admin Industries: List all organizations with attached opportunity counts
   */
  async getOrganizations() {
    const res = await db.query(
      `SELECT o.id, o.name, o.organization_type, o.location, o.verification_status, o.created_at,
              COUNT(DISTINCT opp.id)::int AS "opportunityCount"
       FROM public.organizations o
       LEFT JOIN public.opportunities opp ON opp.organization_id = o.id
       GROUP BY o.id, o.name, o.organization_type, o.location, o.verification_status, o.created_at
       ORDER BY o.name ASC`
    );

    const organizations = res.rows.map((org: any) => ({
      id: org.id,
      name: org.name,
      organization_type: org.organization_type || "Pharmaceutical / Healthcare",
      location: org.location || "India",
      verification_status: org.verification_status || "approved",
      created_at: org.created_at ? new Date(org.created_at).toISOString() : new Date().toISOString(),
      opportunityCount: Number(org.opportunityCount || 0),
    }));

    return { organizations };
  }

  /**
   * Super Admin Industries: Atomically create an organization and provision contact account
   */
  async createIndustryWithAdmin(input: CreateIndustryAdminInput) {
    const name = input.name?.trim();
    const organizationType = input.organizationType?.trim() || "Pharmaceutical / Healthcare";
    const location = input.location?.trim() || "India";
    const contactFullName = input.contactFullName?.trim();
    const contactEmail = input.contactEmail?.trim().toLowerCase();
    const temporaryPassword = input.temporaryPassword;

    if (!name) throw new AppError("Industry / Organization name is required.", 400);
    if (!contactFullName) throw new AppError("Contact person full name is required.", 400);
    if (!contactEmail || !contactEmail.includes("@")) throw new AppError("Valid contact email is required.", 400);
    if (!temporaryPassword || temporaryPassword.length < 6) {
      throw new AppError("Temporary password must be at least 6 characters long.", 400);
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Check email uniqueness in users table
      const emailCheck = await client.query(
        `SELECT id FROM public.users WHERE email = $1 LIMIT 1`,
        [contactEmail]
      );
      if (emailCheck.rows.length > 0) {
        throw new AppError(`An account with email '${contactEmail}' already exists.`, 409);
      }

      // 1. Create Organization
      const orgRes = await client.query(
        `INSERT INTO public.organizations (name, organization_type, location, verification_status)
         VALUES ($1, $2, $3, 'approved')
         RETURNING id, name`,
        [name, organizationType, location]
      );
      const newOrg = orgRes.rows[0];

      // 2. Hash temporary password
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      // 3. Create User record
      const userRes = await client.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'industry')
         RETURNING id`,
        [contactEmail, passwordHash]
      );
      const authUserId = userRes.rows[0].id;

      // 4. Create Profile linked to the newly created organization
      await client.query(
        `INSERT INTO public.profiles (id, full_name, organization_id, institution_id)
         VALUES ($1, $2, $3, NULL)`,
        [authUserId, contactFullName, newOrg.id]
      );

      await client.query("COMMIT");

      return {
        success: true,
        organizationId: newOrg.id,
        organizationName: newOrg.name,
        userId: authUserId,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Super Admin Industries: Update verification status
   */
  async updateOrganizationStatus(organizationId: string, status: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      throw new AppError("Invalid organization ID format.", 400);
    }

    const allowed = ["pending", "approved", "rejected", "suspended"];
    if (!allowed.includes(status)) {
      throw new AppError(`Invalid verification status '${status}'. Allowed: ${allowed.join(", ")}`, 400);
    }

    const res = await db.query(
      `UPDATE public.organizations
       SET verification_status = $1
       WHERE id = $2
       RETURNING id, name, organization_type, verification_status`,
      [status, organizationId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Organization not found.", 404);
    }

    return {
      success: true,
      organization: res.rows[0],
    };
  }

  /**
   * Super Admin Users: List all users across roles (excluding password_hash)
   */
  async getUsers() {
    const res = await db.query(
      `SELECT u.id, u.email, u.role, u.created_at,
              p.full_name, p.phone, p.department, p.program,
              i.name AS institution_name,
              o.name AS organization_name
       FROM public.users u
       LEFT JOIN public.profiles p ON u.id = p.id
       LEFT JOIN public.institutions i ON p.institution_id = i.id
       LEFT JOIN public.organizations o ON p.organization_id = o.id
       ORDER BY u.created_at DESC`
    );

    const users = res.rows.map((row: any) => ({
      id: row.id,
      full_name: row.full_name || "",
      email: row.email,
      role: row.role,
      phone: row.phone || null,
      department: row.department || null,
      program: row.program || null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      institutionName: row.institution_name || null,
      organizationName: row.organization_name || null,
    }));

    return { users };
  }

  /**
   * Super Admin Users: Safely update user role with strict administrative safeguards
   */
  async updateUserRole(targetUserId: string, newRole: string, callerUserId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      throw new AppError("Invalid user ID format.", 400);
    }

    if (targetUserId === callerUserId) {
      throw new AppError("Cannot modify your own administrative role.", 400);
    }

    const allowedRoles = ["student", "faculty", "institution", "industry"];
    if (!allowedRoles.includes(newRole)) {
      throw new AppError(
        `Invalid target role assignment '${newRole}'. Cannot escalate to super_admin or assign unrecognized role.`,
        400
      );
    }

    // Verify target user exists
    const targetRes = await db.query(
      `SELECT id, role, email FROM public.users WHERE id = $1 LIMIT 1`,
      [targetUserId]
    );

    if (targetRes.rows.length === 0) {
      throw new AppError("Target user not found.", 404);
    }

    const targetUser = targetRes.rows[0];
    if (targetUser.role === "super_admin") {
      throw new AppError("Cannot downgrade an existing Super Admin account.", 400);
    }

    await db.query(
      `UPDATE public.users
       SET role = $1, updated_at = NOW()
       WHERE id = $2`,
      [newRole, targetUserId]
    );

    return {
      success: true,
      userId: targetUserId,
      role: newRole,
    };
  }

  /**
   * Super Admin Opportunities: List all opportunities with organization and creator metadata
   */
  async getOpportunities() {
    const res = await db.query(
      `SELECT o.id, o.title, o.description, o.opportunity_type, o.status,
              o.location, o.application_deadline, o.created_at,
              org.name AS organization_name,
              p.full_name AS creator_name,
              u.email AS creator_email
       FROM public.opportunities o
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       LEFT JOIN public.users u ON o.created_by = u.id
       LEFT JOIN public.profiles p ON u.id = p.id
       ORDER BY o.created_at DESC`
    );

    const opportunities = res.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      opportunity_type: row.opportunity_type,
      status: row.status,
      location: row.location || null,
      application_deadline: row.application_deadline
        ? (typeof row.application_deadline === "string" ? row.application_deadline.split("T")[0] : row.application_deadline.toISOString().split("T")[0])
        : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      organizationName: row.organization_name || null,
      creatorName: row.creator_name || null,
      creatorEmail: row.creator_email || null,
    }));

    return { opportunities };
  }

  /**
   * Super Admin Opportunities: Moderate opportunity status (published, closed, archived)
   * Strictly preserves archive semantics (never physically deletes)
   */
  async moderateOpportunityStatus(opportunityId: string, status: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(opportunityId)) {
      throw new AppError("Invalid opportunity ID format.", 400);
    }

    const allowed = ["published", "closed", "archived"];
    if (!allowed.includes(status)) {
      throw new AppError(`Invalid opportunity moderation status '${status}'. Allowed: ${allowed.join(", ")}`, 400);
    }

    const res = await db.query(
      `UPDATE public.opportunities
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, title, status`,
      [status, opportunityId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Opportunity not found.", 404);
    }

    return {
      success: true,
      opportunity: res.rows[0],
    };
  }

  /**
   * Super Admin Analytics: Global analytical intelligence matching frontend contracts
   */
  async getAnalytics() {
    const [
      studentsRes,
      attemptsRes,
      compsRes,
      oppsRes,
      appsRes,
      placementsRes,
      instsRes,
      orgsRes,
    ] = await Promise.all([
      db.query(`SELECT id FROM public.users WHERE role = 'student'`),
      db.query(`SELECT DISTINCT student_id FROM public.assessment_attempts WHERE status = 'completed'`),
      db.query(
        `SELECT sc.proficiency_score, c.name, c.category
         FROM public.student_competencies sc
         JOIN public.competencies c ON sc.competency_id = c.id
         WHERE sc.proficiency_score IS NOT NULL`
      ),
      db.query(`SELECT status, opportunity_type FROM public.opportunities`),
      db.query(`SELECT status FROM public.applications`),
      db.query(`SELECT status FROM public.internship_placements`),
      db.query(`SELECT verification_status FROM public.institutions`),
      db.query(`SELECT verification_status FROM public.organizations`),
    ]);

    // 1. Students Analytics
    const totalStudents = studentsRes.rows.length;
    const uniqueAssessedStudents = attemptsRes.rows.length;
    const assessmentCompletionPct =
      totalStudents > 0 ? Math.round((uniqueAssessedStudents / totalStudents) * 100) : 0;

    // 2. Skills Analytics
    let overallScoreSum = 0;
    let scoreCount = 0;
    const categoryScores: Record<string, { sum: number; count: number }> = {
      "Clinical Competence": { sum: 0, count: 0 },
      "Classical Knowledge": { sum: 0, count: 0 },
      "Research & Evidence": { sum: 0, count: 0 },
      "Professional & Integrative Practice": { sum: 0, count: 0 },
    };

    const compAverages: Record<string, { sum: number; count: number; category: string }> = {};

    compsRes.rows.forEach((sc: any) => {
      const score = Number(sc.proficiency_score);
      if (!isNaN(score)) {
        overallScoreSum += score;
        scoreCount += 1;

        const cat = sc.category || "General";
        if (!categoryScores[cat]) {
          categoryScores[cat] = { sum: 0, count: 0 };
        }
        categoryScores[cat].sum += score;
        categoryScores[cat].count += 1;

        const compName = sc.name;
        if (compName) {
          if (!compAverages[compName]) {
            compAverages[compName] = { sum: 0, count: 0, category: cat };
          }
          compAverages[compName].sum += score;
          compAverages[compName].count += 1;
        }
      }
    });

    const overallAvgSkill = scoreCount > 0 ? (overallScoreSum / scoreCount).toFixed(1) : "0.0";

    const priorityDevelopmentAreas = Object.entries(compAverages)
      .map(([name, data]) => ({
        name,
        category: data.category,
        avg: Math.round(data.sum / data.count),
      }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 4);

    // 3. Opportunities Analytics
    const oppStatusCounts: Record<string, number> = { published: 0, closed: 0, archived: 0, draft: 0 };
    const oppTypeCounts: Record<string, number> = {};

    oppsRes.rows.forEach((o: any) => {
      if (oppStatusCounts[o.status] !== undefined) {
        oppStatusCounts[o.status] += 1;
      } else {
        oppStatusCounts[o.status] = 1;
      }
      const type = o.opportunity_type || "internship";
      oppTypeCounts[type] = (oppTypeCounts[type] || 0) + 1;
    });

    // 4. Applications Analytics
    const totalApps = appsRes.rows.length;
    const appStatusCounts: Record<string, number> = {
      submitted: 0,
      under_review: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
    };

    appsRes.rows.forEach((a: any) => {
      const s = a.status === "applied" ? "submitted" : a.status;
      if (appStatusCounts[s] !== undefined) {
        appStatusCounts[s] += 1;
      } else {
        appStatusCounts[s] = 1;
      }
    });

    // 5. Internship / Placement Analytics
    const placementStatusCounts: Record<string, number> = {
      selected: appStatusCounts.selected || 0,
      offered: 0,
      joined: 0,
      in_progress: 0,
      completed: 0,
    };

    placementsRes.rows.forEach((p: any) => {
      if (placementStatusCounts[p.status] !== undefined) {
        placementStatusCounts[p.status] += 1;
      } else {
        placementStatusCounts[p.status] = 1;
      }
    });

    // 6. Institutions Analytics
    const totalInsts = instsRes.rows.length;
    const instStatusCounts: Record<string, number> = { approved: 0, pending: 0, suspended: 0, rejected: 0 };
    instsRes.rows.forEach((i: any) => {
      const s = i.verification_status || "approved";
      instStatusCounts[s] = (instStatusCounts[s] || 0) + 1;
    });

    // 7. Organizations Analytics
    const totalOrgs = orgsRes.rows.length;
    const orgStatusCounts: Record<string, number> = { approved: 0, pending: 0, suspended: 0, rejected: 0 };
    orgsRes.rows.forEach((o: any) => {
      const s = o.verification_status || "approved";
      orgStatusCounts[s] = (orgStatusCounts[s] || 0) + 1;
    });

    return {
      totalStudents,
      uniqueAssessedStudents,
      assessmentCompletionPct,
      overallAvgSkill,
      categoryScores,
      priorityDevelopmentAreas,
      oppStatusCounts,
      oppTypeCounts,
      totalApps,
      appStatusCounts,
      placementStatusCounts,
      totalInsts,
      instStatusCounts,
      totalOrgs,
      orgStatusCounts,
    };
  }
}

export const superAdminService = new SuperAdminService();
