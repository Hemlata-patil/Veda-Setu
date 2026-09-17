import { db } from "../db";
import { AppError } from "../middleware/error.middleware";

export interface StudentCompetencyItem {
  id: string;
  student_id: string;
  competency_id: string;
  proficiency_score: number | null;
  last_assessed_at: string | null;
  source: string | null;
  verified: boolean;
  competency_name: string;
  competency_category: string;
  competency_description: string | null;
}

export class StudentCompetencyService {
  /**
   * Retrieve all evaluated competencies for the given student.
   * Joins with public.competencies to provide competency details.
   */
  async getStudentCompetencies(studentId: string): Promise<StudentCompetencyItem[]> {
    const res = await db.query<StudentCompetencyItem>(
      `SELECT
         sc.id,
         sc.student_id,
         sc.competency_id,
         sc.proficiency_score,
         sc.last_assessed_at,
         sc.source,
         sc.verified,
         c.name AS competency_name,
         c.category AS competency_category,
         c.description AS competency_description
       FROM public.student_competencies sc
       JOIN public.competencies c ON c.id = sc.competency_id
       WHERE sc.student_id = $1
       ORDER BY c.category ASC, c.name ASC`,
      [studentId]
    );

    return res.rows;
  }
}

export const studentCompetencyService = new StudentCompetencyService();
