import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import { hashPassword } from "../utils/password";
import { CreateFacultyInput } from "../utils/validation";

export interface InstitutionDashboardSummary {
  institution: {
    id: string;
    name: string;
    code: string | null;
    category: string | null;
    location: string | null;
    verification_status: string;
  };
  metrics: {
    totalStudents: number;
    totalFaculty: number;
    assessedStudentsCount: number;
    averageCohortScore: number | null;
    activeMentorshipsCount: number;
    totalPlacementsCount: number;
    activePlacementsCount: number;
    completedPlacementsCount: number;
  };
  applicationStats: {
    total: number;
    applied: number;
    underReview: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    withdrawn: number;
  };
}

export interface InstitutionFacultySummary {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  designation: string | null;
  createdAt: string;
}

export interface InstitutionStudentSummary {
  id: string;
  fullName: string;
  email: string;
  program: string | null;
  year: number | null;
  department: string | null;
  createdAt: string;
  hasAssessment: boolean;
  overallScore: number | null;
}

export class InstitutionService {
  /**
   * Helper: Resolve caller's institution ID from profile
   */
  private async getCallerInstitutionId(institutionUserId: string): Promise<string> {
    const res = await db.query(
      `SELECT institution_id FROM public.profiles WHERE id = $1`,
      [institutionUserId]
    );

    if (res.rows.length === 0 || !res.rows[0].institution_id) {
      throw new AppError("Your institution account is not affiliated with a valid institution.", 403);
    }

    return res.rows[0].institution_id;
  }

  /**
   * Institution Dashboard Summary
   */
  async getDashboard(institutionUserId: string): Promise<InstitutionDashboardSummary> {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);

    // 1. Fetch institution details
    const instRes = await db.query(
      `SELECT id, name, code, category, location, verification_status
       FROM public.institutions
       WHERE id = $1`,
      [institutionId]
    );

    if (instRes.rows.length === 0) {
      throw new AppError("Institution record not found", 404);
    }
    const institution = instRes.rows[0];

    // 2. Fetch students affiliated with this institution (role strictly from users)
    const studentsRes = await db.query(
      `SELECT p.id
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.institution_id = $1 AND u.role = 'student'`,
      [institutionId]
    );
    const studentIds = studentsRes.rows.map((r: any) => r.id);
    const totalStudents = studentIds.length;

    // 3. Fetch faculty affiliated with this institution
    const facultyRes = await db.query(
      `SELECT COUNT(p.id)::int AS count
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.institution_id = $1 AND u.role = 'faculty'`,
      [institutionId]
    );
    const totalFaculty = facultyRes.rows[0].count;

    // 4. Competency scores for students of this institution
    let assessedStudentsCount = 0;
    let averageCohortScore: number | null = null;

    if (studentIds.length > 0) {
      const compsRes = await db.query(
        `SELECT student_id, AVG(proficiency_score)::numeric AS student_avg
         FROM public.student_competencies
         WHERE student_id = ANY($1::uuid[]) AND proficiency_score IS NOT NULL
         GROUP BY student_id`,
        [studentIds]
      );

      assessedStudentsCount = compsRes.rows.length;
      if (assessedStudentsCount > 0) {
        const sumScores = compsRes.rows.reduce(
          (acc: number, r: any) => acc + Number(r.student_avg),
          0
        );
        averageCohortScore = Math.round(sumScores / assessedStudentsCount);
      }
    }

    // 5. Active Mentorships count for cohort students
    let activeMentorshipsCount = 0;
    if (studentIds.length > 0) {
      const mentRes = await db.query(
        `SELECT COUNT(id)::int AS count
         FROM public.mentorships
         WHERE student_id = ANY($1::uuid[]) AND status = 'active'`,
        [studentIds]
      );
      activeMentorshipsCount = Number(mentRes.rows[0]?.count || 0);
    }

    // 6. Placement stats across cohort students
    let totalPlacementsCount = 0;
    let activePlacementsCount = 0;
    let completedPlacementsCount = 0;

    if (studentIds.length > 0) {
      const placeRes = await db.query(
        `SELECT ip.status, COUNT(*)::int AS count
         FROM public.internship_placements ip
         JOIN public.applications a ON ip.application_id = a.id
         WHERE a.student_id = ANY($1::uuid[])
         GROUP BY ip.status`,
        [studentIds]
      );

      for (const row of placeRes.rows) {
        const c = Number(row.count);
        totalPlacementsCount += c;
        if (row.status === "joined" || row.status === "in_progress") {
          activePlacementsCount += c;
        } else if (row.status === "completed") {
          completedPlacementsCount += c;
        }
      }
    }

    // 7. Privacy-preserving application stats across cohort students
    let applicationStats = {
      total: 0,
      applied: 0,
      underReview: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0,
    };

    if (studentIds.length > 0) {
      const appRes = await db.query(
        `SELECT status, COUNT(*)::int AS count
         FROM public.applications
         WHERE student_id = ANY($1::uuid[])
         GROUP BY status`,
        [studentIds]
      );

      for (const row of appRes.rows) {
        const count = Number(row.count);
        applicationStats.total += count;
        if (row.status === "applied") applicationStats.applied += count;
        else if (row.status === "under_review") applicationStats.underReview += count;
        else if (row.status === "shortlisted") applicationStats.shortlisted += count;
        else if (row.status === "selected") applicationStats.selected += count;
        else if (row.status === "rejected") applicationStats.rejected += count;
        else if (row.status === "withdrawn") applicationStats.withdrawn += count;
      }
    }

    return {
      institution,
      metrics: {
        totalStudents,
        totalFaculty,
        assessedStudentsCount,
        averageCohortScore,
        activeMentorshipsCount,
        totalPlacementsCount,
        activePlacementsCount,
        completedPlacementsCount,
      },
      applicationStats,
    };
  }

  /**
   * Institution Faculty Directory
   */
  async getFacultyDirectory(institutionUserId: string): Promise<InstitutionFacultySummary[]> {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);

    const res = await db.query(
      `SELECT p.id, p.full_name, u.email, p.department, p.designation, p.created_at
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.institution_id = $1 AND u.role = 'faculty'
       ORDER BY p.created_at DESC`,
      [institutionId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      department: r.department,
      designation: r.designation,
      createdAt: r.created_at,
    }));
  }

  /**
   * Institution Student Directory
   */
  async getStudentDirectory(institutionUserId: string): Promise<InstitutionStudentSummary[]> {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);

    const res = await db.query(
      `SELECT p.id, p.full_name, u.email, p.program, p.year, p.department, p.created_at,
              AVG(sc.proficiency_score)::numeric AS avg_score,
              COUNT(sc.id)::int AS comps_count
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       LEFT JOIN public.student_competencies sc ON p.id = sc.student_id AND sc.proficiency_score IS NOT NULL
       WHERE p.institution_id = $1 AND u.role = 'student'
       GROUP BY p.id, p.full_name, u.email, p.program, p.year, p.department, p.created_at
       ORDER BY p.full_name ASC`,
      [institutionId]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      program: r.program,
      year: r.year,
      department: r.department,
      createdAt: r.created_at,
      hasAssessment: Number(r.comps_count) > 0,
      overallScore: r.avg_score !== null ? Math.round(Number(r.avg_score)) : null,
    }));
  }

  /**
   * Institution: Get individual student competency detail (Strict check: same institution)
   */
  async getStudentDetail(institutionUserId: string, studentId: string) {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);

    const studentRes = await db.query(
      `SELECT p.id, p.full_name, u.email, p.program, p.year, p.department, p.institution_id, p.created_at,
              inst.name AS institution_name, inst.code AS institution_code
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE p.id = $1 AND u.role = 'student'`,
      [studentId]
    );

    if (studentRes.rows.length === 0) {
      throw new AppError("Student not found", 404);
    }

    const student = studentRes.rows[0];
    if (student.institution_id !== institutionId) {
      throw new AppError("Access denied. Student does not belong to your affiliated institution.", 403);
    }

    // Fetch student's competencies
    const compsRes = await db.query(
      `SELECT sc.competency_id, sc.proficiency_score, sc.last_assessed_at, sc.source, sc.verified,
              c.name, c.category, c.description
       FROM public.student_competencies sc
       JOIN public.competencies c ON sc.competency_id = c.id
       WHERE sc.student_id = $1
       ORDER BY c.category, c.name`,
      [studentId]
    );

    // Fetch privacy-preserving application counts
    const appStatsRes = await db.query(
      `SELECT status, COUNT(*)::int AS count
       FROM public.applications
       WHERE student_id = $1
       GROUP BY status`,
      [studentId]
    );

    let applicationCounts = {
      total: 0,
      applied: 0,
      underReview: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const r of appStatsRes.rows) {
      const c = Number(r.count);
      applicationCounts.total += c;
      if (r.status === "applied") applicationCounts.applied += c;
      else if (r.status === "under_review") applicationCounts.underReview += c;
      else if (r.status === "shortlisted") applicationCounts.shortlisted += c;
      else if (r.status === "selected") applicationCounts.selected += c;
      else if (r.status === "rejected") applicationCounts.rejected += c;
      else if (r.status === "withdrawn") applicationCounts.withdrawn += c;
    }

    // Fetch active/recent mentorship for this student
    const mentRes = await db.query(
      `SELECT m.id, m.status, m.created_at, m.updated_at,
              p.full_name AS mentor_name, u.email AS mentor_email,
              p.designation AS mentor_designation, p.department AS mentor_department
       FROM public.mentorships m
       JOIN public.users u ON m.faculty_id = u.id
       LEFT JOIN public.profiles p ON u.id = p.id
       WHERE m.student_id = $1
       ORDER BY m.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    const mentorship = mentRes.rows.length > 0 ? {
      id: mentRes.rows[0].id,
      status: mentRes.rows[0].status,
      createdAt: mentRes.rows[0].created_at,
      updatedAt: mentRes.rows[0].updated_at,
      mentorName: mentRes.rows[0].mentor_name || "Assigned Mentor",
      mentorEmail: mentRes.rows[0].mentor_email,
      mentorDesignation: mentRes.rows[0].mentor_designation || null,
      mentorDepartment: mentRes.rows[0].mentor_department || null,
    } : null;

    return {
      student: {
        id: student.id,
        fullName: student.full_name,
        email: student.email,
        program: student.program,
        year: student.year,
        department: student.department,
        institutionName: student.institution_name,
        institutionCode: student.institution_code,
        createdAt: student.created_at,
      },
      competencies: compsRes.rows,
      applicationCounts,
      mentorship,
    };
  }

  /**
   * Institution: Cohort Analytics
   */
  async getAnalytics(institutionUserId: string) {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);

    // 1. Fetch institution details
    const instRes = await db.query(
      `SELECT id, name, code, category, location, verification_status
       FROM public.institutions
       WHERE id = $1`,
      [institutionId]
    );
    const institution = instRes.rows[0] || null;

    // 2. Fetch institution students
    const studentsRes = await db.query(
      `SELECT p.id
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.institution_id = $1 AND u.role = 'student'`,
      [institutionId]
    );
    const studentIds = studentsRes.rows.map((r: any) => r.id);
    const totalStudents = studentIds.length;

    let assessedStudentsCount = 0;
    let categoryAverages: Record<string, { totalScore: number; count: number; avg: number }> = {
      academic_domain: { totalScore: 0, count: 0, avg: 0 },
      clinical_practical: { totalScore: 0, count: 0, avg: 0 },
      research: { totalScore: 0, count: 0, avg: 0 },
      professional: { totalScore: 0, count: 0, avg: 0 },
    };
    let competencyDistributions: Array<{ id: string; name: string; category: string; averageScore: number }> = [];
    let priorityDevelopmentAreas: Array<{ id: string; name: string; category: string; count: number }> = [];

    if (studentIds.length > 0) {
      // Assessed students count
      const assessedRes = await db.query(
        `SELECT COUNT(DISTINCT student_id)::int AS count
         FROM public.student_competencies
         WHERE student_id = ANY($1::uuid[]) AND proficiency_score IS NOT NULL`,
        [studentIds]
      );
      assessedStudentsCount = Number(assessedRes.rows[0].count || 0);

      // Category and competency averages
      const compAveragesRes = await db.query(
        `SELECT c.id, c.name, c.category, AVG(sc.proficiency_score)::numeric AS avg_score
         FROM public.student_competencies sc
         JOIN public.competencies c ON sc.competency_id = c.id
         WHERE sc.student_id = ANY($1::uuid[]) AND sc.proficiency_score IS NOT NULL
         GROUP BY c.id, c.name, c.category
         ORDER BY c.category, c.name`,
        [studentIds]
      );

      for (const row of compAveragesRes.rows) {
        const score = Math.round(Number(row.avg_score));
        competencyDistributions.push({
          id: row.id,
          name: row.name,
          category: row.category,
          averageScore: score,
        });

        if (!categoryAverages[row.category]) {
          categoryAverages[row.category] = { totalScore: 0, count: 0, avg: 0 };
        }
        categoryAverages[row.category].totalScore += score;
        categoryAverages[row.category].count += 1;
      }

      for (const cat in categoryAverages) {
        if (categoryAverages[cat].count > 0) {
          categoryAverages[cat].avg = Math.round(
            categoryAverages[cat].totalScore / categoryAverages[cat].count
          );
        }
      }

      // Priority development areas (competencies with scores < 60)
      const gapRes = await db.query(
        `SELECT c.id, c.name, c.category, COUNT(sc.student_id)::int AS count
         FROM public.student_competencies sc
         JOIN public.competencies c ON sc.competency_id = c.id
         WHERE sc.student_id = ANY($1::uuid[]) AND sc.proficiency_score < 60
         GROUP BY c.id, c.name, c.category
         ORDER BY count DESC
         LIMIT 6`,
        [studentIds]
      );

      priorityDevelopmentAreas = gapRes.rows.map((r: any) => {
        const count = Number(r.count);
        const affectedPercentage = assessedStudentsCount > 0
          ? Math.round((count / assessedStudentsCount) * 100)
          : 0;
        return {
          id: r.id,
          competencyId: r.id,
          name: r.name,
          competencyName: r.name,
          category: r.category,
          count,
          affectedCount: count,
          affectedPercentage,
        };
      });
    }

    const finalCategoryAverages: Record<string, any> = {
      academic_domain: {
        score: categoryAverages.academic_domain?.count > 0 ? categoryAverages.academic_domain.avg : null,
        assessedCount: categoryAverages.academic_domain?.count || 0,
        totalScore: categoryAverages.academic_domain?.totalScore || 0,
        count: categoryAverages.academic_domain?.count || 0,
        avg: categoryAverages.academic_domain?.avg || 0,
      },
      clinical_practical: {
        score: categoryAverages.clinical_practical?.count > 0 ? categoryAverages.clinical_practical.avg : null,
        assessedCount: categoryAverages.clinical_practical?.count || 0,
        totalScore: categoryAverages.clinical_practical?.totalScore || 0,
        count: categoryAverages.clinical_practical?.count || 0,
        avg: categoryAverages.clinical_practical?.avg || 0,
      },
      research: {
        score: categoryAverages.research?.count > 0 ? categoryAverages.research.avg : null,
        assessedCount: categoryAverages.research?.count || 0,
        totalScore: categoryAverages.research?.totalScore || 0,
        count: categoryAverages.research?.count || 0,
        avg: categoryAverages.research?.avg || 0,
      },
      professional: {
        score: categoryAverages.professional?.count > 0 ? categoryAverages.professional.avg : null,
        assessedCount: categoryAverages.professional?.count || 0,
        totalScore: categoryAverages.professional?.totalScore || 0,
        count: categoryAverages.professional?.count || 0,
        avg: categoryAverages.professional?.avg || 0,
      },
    };

    let totalScoreSum = 0;
    let totalScoreCount = 0;
    for (const comp of competencyDistributions) {
      totalScoreSum += comp.averageScore;
      totalScoreCount++;
    }
    const averageCohortScore = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : null;

    const completionPercentage = totalStudents > 0
      ? Math.round((assessedStudentsCount / totalStudents) * 100)
      : 0;

    // Placements
    let totalPlacementsCount = 0;
    let activePlacementsCount = 0;
    let completedPlacementsCount = 0;
    if (studentIds.length > 0) {
      const plRes = await db.query(
        `SELECT ip.status, COUNT(*)::int AS count
         FROM public.internship_placements ip
         JOIN public.applications a ON ip.application_id = a.id
         WHERE a.student_id = ANY($1::uuid[])
         GROUP BY ip.status`,
        [studentIds]
      );

      for (const row of plRes.rows) {
        const c = Number(row.count);
        totalPlacementsCount += c;
        if (row.status === "active" || row.status === "in_progress") activePlacementsCount += c;
        else if (row.status === "completed") completedPlacementsCount += c;
      }
    }

    // Application stats
    let applicationStats = {
      total: 0,
      applied: 0,
      underReview: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0,
    };

    if (studentIds.length > 0) {
      const appRes = await db.query(
        `SELECT status, COUNT(*)::int AS count
         FROM public.applications
         WHERE student_id = ANY($1::uuid[])
         GROUP BY status`,
        [studentIds]
      );

      for (const row of appRes.rows) {
        const count = Number(row.count);
        applicationStats.total += count;
        if (row.status === "applied") applicationStats.applied += count;
        else if (row.status === "under_review") applicationStats.underReview += count;
        else if (row.status === "shortlisted") applicationStats.shortlisted += count;
        else if (row.status === "selected") applicationStats.selected += count;
        else if (row.status === "rejected") applicationStats.rejected += count;
        else if (row.status === "withdrawn") applicationStats.withdrawn += count;
      }
    }

    // Mentorship stats
    let mentorshipStats = {
      total: 0,
      active: 0,
      completed: 0,
      totalMentorships: 0,
      activeMentorships: 0,
      completedMentorships: 0,
    };

    if (studentIds.length > 0) {
      const mentRes = await db.query(
        `SELECT status, COUNT(*)::int AS count
         FROM public.mentorships
         WHERE student_id = ANY($1::uuid[])
         GROUP BY status`,
        [studentIds]
      );

      for (const row of mentRes.rows) {
        const c = Number(row.count);
        mentorshipStats.total += c;
        mentorshipStats.totalMentorships += c;
        if (row.status === "active") {
          mentorshipStats.active += c;
          mentorshipStats.activeMentorships += c;
        } else if (row.status === "completed") {
          mentorshipStats.completed += c;
          mentorshipStats.completedMentorships += c;
        }
      }
    }

    const metrics = {
      totalStudents,
      assessedStudentsCount,
      averageCohortScore,
      activeMentorshipsCount: mentorshipStats.active,
      totalPlacementsCount,
      activePlacementsCount,
      completedPlacementsCount,
    };

    return {
      institution,
      metrics,
      totalStudents,
      assessedStudentsCount,
      completionPercentage,
      categoryAverages: finalCategoryAverages,
      competencies: competencyDistributions,
      priorityDevelopmentAreas,
      applicationStats,
      mentorshipStats,
    };
  }

  /**
   * Institution: Atomic Faculty Provisioning
   * Transaction:
   * 1. Check duplicate email in public.users
   * 2. Hash temporary password
   * 3. Insert into public.users (role = 'faculty')
   * 4. Insert into public.profiles with caller's institution_id & free-text designation
   * 5. Commit
   */
  async provisionFaculty(
    institutionUserId: string,
    input: CreateFacultyInput
  ): Promise<{ facultyId: string; email: string; fullName: string; department: string; designation: string }> {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const department = input.department.trim();
    const designation = input.designation.trim();

    // Check duplicate email
    const existing = await db.query(`SELECT id FROM public.users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      throw new AppError(`An account with email '${email}' already exists. Cannot create a duplicate account.`, 409);
    }

    const passwordHash = await hashPassword(input.temporaryPassword);
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Insert User
      const userRes = await client.query(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'faculty')
         RETURNING id`,
        [email, passwordHash]
      );
      const facultyId = userRes.rows[0].id;

      // Insert Profile
      await client.query(
        `INSERT INTO public.profiles (
          id, full_name, department, designation, institution_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [facultyId, fullName, department, designation, institutionId]
      );

      await client.query("COMMIT");

      return {
        facultyId,
        email,
        fullName,
        department,
        designation,
      };
    } catch (err: any) {
      await client.query("ROLLBACK");
      if (err.code === "23505") {
        throw new AppError(`An account with email '${email}' already exists.`, 409);
      }
      throw err;
    } finally {
      client.release();
    }
  }
  // ─── GET INTERNSHIP PLACEMENTS ────────────────────────────────────────────────
  /**
   * GET /api/institution/internship-placement
   * Returns placement records for all students belonging to the authenticated institution.
   * Tenant isolation: placements are JOIN-filtered so only students of this institution are returned.
   */
  async getInternshipPlacements(institutionUserId: string): Promise<{
    placements: Array<{
      id: string;
      engagementType: string;
      status: string;
      startDate: string | null;
      expectedEndDate: string | null;
      actualEndDate: string | null;
      progressPercent: number | null;
      supervisorName: string | null;
      outcome: string | null;
      createdAt: string;
      student: {
        id: string;
        fullName: string;
        program: string | null;
        year: number | null;
      } | null;
      opportunity: {
        id: string;
        title: string;
        opportunityType: string;
      } | null;
      organization: {
        id: string;
        name: string;
        organizationType: string;
      } | null;
    }>;
  }> {
    const institutionId = await this.getCallerInstitutionId(institutionUserId);

    const res = await db.query(
      `SELECT
         ip.id,
         ip.engagement_type     AS "engagementType",
         ip.status,
         ip.start_date          AS "startDate",
         ip.expected_end_date   AS "expectedEndDate",
         ip.actual_end_date     AS "actualEndDate",
         ip.progress_percent    AS "progressPercent",
         ip.supervisor_name     AS "supervisorName",
         ip.outcome,
         ip.created_at          AS "createdAt",
         -- Student
         p.id                   AS "studentId",
         p.full_name            AS "studentFullName",
         p.program              AS "studentProgram",
         p.year                 AS "studentYear",
         -- Opportunity
         opp.id                 AS "opportunityId",
         opp.title              AS "opportunityTitle",
         opp.opportunity_type   AS "opportunityType",
         -- Organization
         org.id                 AS "organizationId",
         org.name               AS "organizationName",
         org.organization_type  AS "organizationType"
       FROM public.internship_placements ip
       JOIN public.applications app ON app.id = ip.application_id
       JOIN public.profiles p ON p.id = app.student_id
       LEFT JOIN public.opportunities opp ON opp.id = app.opportunity_id
       LEFT JOIN public.organizations org ON org.id = opp.organization_id
       WHERE p.institution_id = $1
       ORDER BY ip.created_at DESC`,
      [institutionId]
    );

    const placements = res.rows.map((row: any) => ({
      id: row.id,
      engagementType: row.engagementType || "internship",
      status: row.status,
      startDate: row.startDate ? new Date(row.startDate).toISOString() : null,
      expectedEndDate: row.expectedEndDate ? new Date(row.expectedEndDate).toISOString() : null,
      actualEndDate: row.actualEndDate ? new Date(row.actualEndDate).toISOString() : null,
      progressPercent: row.progressPercent !== null ? Number(row.progressPercent) : null,
      supervisorName: row.supervisorName || null,
      outcome: row.outcome || null,
      createdAt: new Date(row.createdAt).toISOString(),
      student: row.studentId
        ? {
            id: row.studentId,
            fullName: row.studentFullName || "Student",
            program: row.studentProgram || null,
            year: row.studentYear ? Number(row.studentYear) : null,
          }
        : null,
      opportunity: row.opportunityId
        ? {
            id: row.opportunityId,
            title: row.opportunityTitle || "Opportunity",
            opportunityType: row.opportunityType || "internship",
          }
        : null,
      organization: row.organizationId
        ? {
            id: row.organizationId,
            name: row.organizationName || "Organization",
            organizationType: row.organizationType || "private",
          }
        : null,
    }));

    return { placements };
  }
}

export const institutionService = new InstitutionService();
