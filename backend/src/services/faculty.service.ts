import { db } from "../db";
import { AppError } from "../middleware/error.middleware";

export interface FacultyDashboardSummary {
  faculty: {
    id: string;
    fullName: string;
    email: string;
    department: string | null;
    designation: string | null;
  };
  institution: {
    id: string;
    name: string;
    code: string | null;
    location: string | null;
  } | null;
  metrics: {
    cohortStudentCount: number;
    assessedStudentsCount: number;
    averageCohortScore: number | null;
    activeStudentPlacementsCount?: number;
    inProgressPlacementsCount?: number;
  };
  recentStudents: Array<{
    id: string;
    fullName: string;
    email: string;
    program: string | null;
    year: number | null;
    overallScore: number | null;
  }>;
}

export interface FacultyStudentItem {
  id: string;
  fullName: string;
  email: string;
  program: string | null;
  year: number | null;
  department: string | null;
  createdAt: string;
  hasAssessment: boolean;
  overallScore: number | null;
  priorityAreasCount: number;
}

export class FacultyService {
  /**
   * Helper: Resolve faculty profile and affiliated institution ID
   */
  private async getFacultyAffiliation(facultyUserId: string) {
    const res = await db.query(
      `SELECT p.id, p.full_name, u.email, p.department, p.designation, p.institution_id,
              inst.name AS institution_name, inst.code AS institution_code, inst.location AS institution_location
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE p.id = $1 AND u.role = 'faculty'`,
      [facultyUserId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Faculty account not found", 404);
    }

    return res.rows[0];
  }

  /**
   * Faculty Dashboard Summary
   */
  async getDashboard(facultyUserId: string): Promise<FacultyDashboardSummary> {
    const faculty = await this.getFacultyAffiliation(facultyUserId);

    if (!faculty.institution_id) {
      return {
        faculty: {
          id: faculty.id,
          fullName: faculty.full_name,
          email: faculty.email,
          department: faculty.department,
          designation: faculty.designation,
        },
        institution: null,
        metrics: {
          cohortStudentCount: 0,
          assessedStudentsCount: 0,
          averageCohortScore: null,
        },
        recentStudents: [],
      };
    }

    const institutionId = faculty.institution_id;

    // 1. Fetch cohort students count
    const studentsRes = await db.query(
      `SELECT p.id, p.full_name, u.email, p.program, p.year
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.institution_id = $1 AND u.role = 'student'
       ORDER BY p.created_at DESC`,
      [institutionId]
    );

    const students = studentsRes.rows;
    const studentIds = students.map((s: any) => s.id);
    const cohortStudentCount = students.length;

    // 2. Fetch competency scores for institution cohort
    let assessedStudentsCount = 0;
    let averageCohortScore: number | null = null;
    const studentScoreMap = new Map<string, number>();

    if (studentIds.length > 0) {
      const compsRes = await db.query(
        `SELECT student_id, AVG(proficiency_score)::numeric AS avg_score
         FROM public.student_competencies
         WHERE student_id = ANY($1::uuid[]) AND proficiency_score IS NOT NULL
         GROUP BY student_id`,
        [studentIds]
      );

      assessedStudentsCount = compsRes.rows.length;
      if (assessedStudentsCount > 0) {
        let total = 0;
        for (const r of compsRes.rows) {
          const score = Math.round(Number(r.avg_score));
          studentScoreMap.set(r.student_id, score);
          total += score;
        }
        averageCohortScore = Math.round(total / assessedStudentsCount);
      }
    }

    // 3. Recent students (up to 4)
    const recentStudents = students.slice(0, 4).map((s: any) => ({
      id: s.id,
      fullName: s.full_name,
      email: s.email,
      program: s.program,
      year: s.year,
      overallScore: studentScoreMap.get(s.id) ?? null,
    }));

    // 4. Cohort placement counts if any
    let activeStudentPlacementsCount = 0;
    let inProgressPlacementsCount = 0;
    if (studentIds.length > 0) {
      try {
        const plRes = await db.query(
          `SELECT p.id, p.status
           FROM public.internship_placements p
           JOIN public.applications a ON p.application_id = a.id
           WHERE a.student_id = ANY($1::uuid[])`,
          [studentIds]
        );
        activeStudentPlacementsCount = plRes.rows.length;
        inProgressPlacementsCount = plRes.rows.filter(
          (p: any) => p.status === "in_progress" || p.status === "joined"
        ).length;
      } catch {
        activeStudentPlacementsCount = 0;
        inProgressPlacementsCount = 0;
      }
    }

    return {
      faculty: {
        id: faculty.id,
        fullName: faculty.full_name,
        email: faculty.email,
        department: faculty.department,
        designation: faculty.designation,
      },
      institution: {
        id: institutionId,
        name: faculty.institution_name,
        code: faculty.institution_code,
        location: faculty.institution_location,
      },
      metrics: {
        cohortStudentCount,
        assessedStudentsCount,
        averageCohortScore,
        activeStudentPlacementsCount,
        inProgressPlacementsCount,
      },
      recentStudents,
    };
  }

  /**
   * Faculty: List institution cohort students
   */
  async getInstitutionStudents(facultyUserId: string): Promise<FacultyStudentItem[]> {
    const faculty = await this.getFacultyAffiliation(facultyUserId);

    if (!faculty.institution_id) {
      throw new AppError("Institutional affiliation required to view student cohorts.", 403);
    }

    const res = await db.query(
      `SELECT p.id, p.full_name, u.email, p.program, p.year, p.department, p.created_at,
              AVG(sc.proficiency_score)::numeric AS avg_score,
              COUNT(sc.id)::int AS comps_count,
              COUNT(CASE WHEN sc.proficiency_score < 60 THEN 1 END)::int AS priority_areas_count
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       LEFT JOIN public.student_competencies sc ON p.id = sc.student_id AND sc.proficiency_score IS NOT NULL
       WHERE p.institution_id = $1 AND u.role = 'student'
       GROUP BY p.id, p.full_name, u.email, p.program, p.year, p.department, p.created_at
       ORDER BY p.full_name ASC`,
      [faculty.institution_id]
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
      priorityAreasCount: Number(r.priority_areas_count) || 0,
    }));
  }

  /**
   * Faculty: Get single student competency audit (Strict multi-tenant check: same institution only)
   */
  async getStudentDetail(facultyUserId: string, studentId: string) {
    const faculty = await this.getFacultyAffiliation(facultyUserId);

    if (!faculty.institution_id) {
      throw new AppError("Institutional affiliation required.", 403);
    }

    // Fetch target student profile
    const studentRes = await db.query(
      `SELECT p.id, p.full_name, u.email, p.program, p.year, p.department, p.institution_id, p.created_at,
              inst.name AS institution_name, inst.code AS institution_code, inst.location AS institution_location
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

    // STRICT INSTITUTIONAL BOUNDARY CHECK
    if (student.institution_id !== faculty.institution_id) {
      throw new AppError("Access denied. Student does not belong to your affiliated institution.", 403);
    }

    // Fetch competencies
    const compsRes = await db.query(
      `SELECT sc.competency_id, sc.proficiency_score, sc.last_assessed_at, sc.source, sc.verified,
              c.name, c.category, c.description
       FROM public.student_competencies sc
       JOIN public.competencies c ON sc.competency_id = c.id
       WHERE sc.student_id = $1
       ORDER BY c.category, c.name`,
      [studentId]
    );

    // Fetch student's mentorship record with this faculty member
    let mentorship: any = null;
    try {
      const mentorshipRes = await db.query(
        `SELECT id, status, mentor_note, request_note, created_at, updated_at
         FROM public.mentorships
         WHERE faculty_id = $1 AND student_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [facultyUserId, studentId]
      );
      mentorship = mentorshipRes.rows[0] || null;
    } catch {
      mentorship = null;
    }

    // Fetch student's internship and placement records
    let placements: any[] = [];
    try {
      const placementsRes = await db.query(
        `SELECT p.id, p.engagement_type, p.status, p.start_date, p.expected_end_date,
                p.actual_end_date, p.progress_percent, p.outcome,
                o.title AS opportunity_title, org.name AS organization_name
         FROM public.internship_placements p
         JOIN public.applications a ON p.application_id = a.id
         JOIN public.opportunities o ON a.opportunity_id = o.id
         LEFT JOIN public.organizations org ON o.organization_id = org.id
         WHERE a.student_id = $1
         ORDER BY p.created_at DESC`,
        [studentId]
      );
      placements = placementsRes.rows;
    } catch {
      placements = [];
    }

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
        institutionLocation: student.institution_location,
        createdAt: student.created_at,
      },
      competencies: compsRes.rows,
      placements,
      mentorship,
    };
  }
}

export const facultyService = new FacultyService();
