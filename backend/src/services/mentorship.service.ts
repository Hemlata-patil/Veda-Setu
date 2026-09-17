import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import { RequestMentorshipInput, InitiateMentorshipInput, UpdateMentorNoteInput } from "../utils/validation";

export interface StudentMentorshipDashboard {
  activeMentorship: {
    id: string;
    facultyId: string;
    facultyName: string;
    facultyDepartment: string | null;
    status: string;
    requestNote: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  pendingMentorship: {
    id: string;
    facultyId: string;
    facultyName: string;
    facultyDepartment: string | null;
    status: string;
    requestNote: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  latestRejectedMentorship: {
    id: string;
    facultyId: string;
    facultyName: string;
    facultyDepartment: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  completedMentorships: Array<{
    id: string;
    facultyId: string;
    facultyName: string;
    facultyDepartment: string | null;
    status: string;
    requestNote: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  availableFaculty: Array<{
    id: string;
    fullName: string;
    department: string | null;
    designation: string | null;
  }>;
  hasInstitution: boolean;
  institutionName: string | null;
}

export interface FacultyMentorshipDashboard {
  pendingRequests: Array<{
    id: string;
    studentId: string;
    studentName: string;
    program: string | null;
    year: number | null;
    department: string | null;
    status: string;
    requestNote: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  activeMentees: Array<{
    id: string;
    studentId: string;
    studentName: string;
    program: string | null;
    year: number | null;
    department: string | null;
    status: string;
    mentorNote: string | null;
    overallScore: number | null;
    priorityAreasCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  completedMentees: Array<{
    id: string;
    studentId: string;
    studentName: string;
    program: string | null;
    year: number | null;
    department: string | null;
    status: string;
    mentorNote: string | null;
    overallScore: number | null;
    priorityAreasCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

export class MentorshipService {
  /**
   * Helper: Resolve user's profile and institution affiliation
   */
  private async getUserProfile(userId: string) {
    const res = await db.query(
      `SELECT p.id, p.full_name, p.institution_id, u.role
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       WHERE p.id = $1`,
      [userId]
    );
    if (res.rows.length === 0) {
      throw new AppError("Profile record not found", 404);
    }
    return res.rows[0];
  }

  // ===========================================================================
  // STUDENT WORKFLOWS
  // ===========================================================================

  /**
   * Student Mentorship Dashboard
   * Scoped strictly to student's institution; omits mentor_note.
   */
  async getStudentDashboard(studentUserId: string): Promise<StudentMentorshipDashboard> {
    const profile = await this.getUserProfile(studentUserId);
    const institutionId = profile.institution_id;

    let institutionName: string | null = null;
    let availableFaculty: StudentMentorshipDashboard["availableFaculty"] = [];

    if (institutionId) {
      const instRes = await db.query(
        `SELECT name FROM public.institutions WHERE id = $1`,
        [institutionId]
      );
      institutionName = instRes.rows[0]?.name || null;

      // Available faculty in the exact same institution
      const facRes = await db.query(
        `SELECT p.id, p.full_name, p.department, p.designation
         FROM public.profiles p
         JOIN public.users u ON p.id = u.id
         WHERE p.institution_id = $1 AND u.role = 'faculty'
         ORDER BY p.full_name ASC`,
        [institutionId]
      );

      availableFaculty = facRes.rows.map((f: any) => ({
        id: f.id,
        fullName: f.full_name || "Faculty Mentor",
        department: f.department || null,
        designation: f.designation || (f.department ? `${f.department} Faculty` : "Faculty Mentor"),
      }));
    }

    // Fetch mentorship records for this student (strictly omitting mentor_note)
    const mRes = await db.query(
      `SELECT m.id, m.faculty_id, m.status, m.request_note, m.created_at, m.updated_at,
              f.full_name AS faculty_name, f.department AS faculty_department
       FROM public.mentorships m
       LEFT JOIN public.profiles f ON m.faculty_id = f.id
       WHERE m.student_id = $1
       ORDER BY m.updated_at DESC`,
      [studentUserId]
    );

    const rows = mRes.rows;

    let activeMentorship: StudentMentorshipDashboard["activeMentorship"] = null;
    let pendingMentorship: StudentMentorshipDashboard["pendingMentorship"] = null;
    let latestRejectedMentorship: StudentMentorshipDashboard["latestRejectedMentorship"] = null;
    const completedMentorships: StudentMentorshipDashboard["completedMentorships"] = [];

    for (const r of rows) {
      const item = {
        id: r.id,
        facultyId: r.faculty_id,
        facultyName: r.faculty_name || "Faculty Mentor",
        facultyDepartment: r.faculty_department || null,
        status: r.status,
        requestNote: r.request_note,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };

      if (r.status === "active" && !activeMentorship) {
        activeMentorship = item;
      } else if (r.status === "pending" && !pendingMentorship) {
        pendingMentorship = item;
      } else if (r.status === "rejected" && !latestRejectedMentorship) {
        latestRejectedMentorship = {
          id: r.id,
          facultyId: r.faculty_id,
          facultyName: r.faculty_name || "Faculty Mentor",
          facultyDepartment: r.faculty_department || null,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      } else if (r.status === "completed") {
        completedMentorships.push(item);
      }
    }

    return {
      activeMentorship,
      pendingMentorship,
      latestRejectedMentorship,
      completedMentorships,
      availableFaculty,
      hasInstitution: Boolean(institutionId),
      institutionName,
    };
  }

  /**
   * Submit Student Mentorship Request
   * Validates same institution and single active mentor constraint.
   */
  async requestMentorship(studentUserId: string, input: RequestMentorshipInput) {
    const studentProfile = await this.getUserProfile(studentUserId);
    if (!studentProfile.institution_id) {
      throw new AppError(
        "Your student profile must be affiliated with an academic institution to request mentorship.",
        400
      );
    }

    // Verify target faculty
    const facProfile = await this.getUserProfile(input.facultyId);
    if (facProfile.role !== "faculty" || !facProfile.institution_id || facProfile.institution_id !== studentProfile.institution_id) {
      throw new AppError(
        "Unauthorized: The selected faculty member is not affiliated with your institution.",
        403
      );
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock student profile to serialize concurrent active mentor checks
      await client.query(
        `SELECT id FROM public.profiles WHERE id = $1 FOR UPDATE`,
        [studentUserId]
      );

      // 2. Check if student already has an active mentor
      const activeRes = await client.query(
        `SELECT id FROM public.mentorships
         WHERE student_id = $1 AND status = 'active'
         LIMIT 1`,
        [studentUserId]
      );
      if (activeRes.rows.length > 0) {
        throw new AppError(
          "You already have an active faculty mentor. A student may have at most one active mentorship at a time.",
          409
        );
      }

      // 3. Check if an active or pending relationship already exists between this pair
      const pairRes = await client.query(
        `SELECT id, status FROM public.mentorships
         WHERE student_id = $1 AND faculty_id = $2 AND status IN ('pending', 'active')
         LIMIT 1`,
        [studentUserId, input.facultyId]
      );

      if (pairRes.rows.length > 0) {
        if (pairRes.rows[0].status === "pending") {
          throw new AppError("You already have a pending mentorship request submitted to this faculty member.", 409);
        } else {
          throw new AppError("You already have an active mentorship with this faculty member.", 409);
        }
      }

      // 4. Insert pending request
      const insertRes = await client.query(
        `INSERT INTO public.mentorships (
           student_id, faculty_id, requested_by, status, request_note, mentor_note
         ) VALUES ($1, $2, $1, 'pending', $3, NULL)
         RETURNING id, faculty_id, student_id, status, request_note, created_at`,
        [studentUserId, input.facultyId, input.requestNote ? input.requestNote.trim() : null]
      );

      await client.query("COMMIT");
      return insertRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // ===========================================================================
  // FACULTY WORKFLOWS
  // ===========================================================================

  /**
   * Faculty Mentorship Pipeline Dashboard
   */
  async getFacultyDashboard(facultyUserId: string): Promise<FacultyMentorshipDashboard> {
    const facultyProfile = await this.getUserProfile(facultyUserId);

    const mRes = await db.query(
      `SELECT m.id, m.student_id, m.status, m.request_note, m.mentor_note, m.created_at, m.updated_at,
              s.full_name AS student_name, s.program, s.year, s.department
       FROM public.mentorships m
       LEFT JOIN public.profiles s ON m.student_id = s.id
       WHERE m.faculty_id = $1
       ORDER BY m.updated_at DESC`,
      [facultyUserId]
    );

    const pendingRequests: FacultyMentorshipDashboard["pendingRequests"] = [];
    const activeMentees: FacultyMentorshipDashboard["activeMentees"] = [];
    const completedMentees: FacultyMentorshipDashboard["completedMentees"] = [];

    const activeOrCompletedStudentIds: string[] = [];

    for (const r of mRes.rows) {
      if (r.status === "pending") {
        pendingRequests.push({
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name || "Ayush Student",
          program: r.program || null,
          year: r.year || null,
          department: r.department || null,
          status: "pending",
          requestNote: r.request_note || null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        });
      } else if (r.status === "active" || r.status === "completed") {
        activeOrCompletedStudentIds.push(r.student_id);
      }
    }

    // Fetch competency scores for active & completed mentees
    const scoreMap = new Map<string, { avg: number; priorityCount: number }>();
    if (activeOrCompletedStudentIds.length > 0) {
      const compRes = await db.query(
        `SELECT student_id, proficiency_score
         FROM public.student_competencies
         WHERE student_id = ANY($1::uuid[]) AND proficiency_score IS NOT NULL`,
        [activeOrCompletedStudentIds]
      );

      const byStudent = new Map<string, number[]>();
      for (const row of compRes.rows) {
        let arr = byStudent.get(row.student_id) || [];
        arr.push(Number(row.proficiency_score));
        byStudent.set(row.student_id, arr);
      }

      for (const [sid, scores] of byStudent.entries()) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const priorityCount = scores.filter((s) => s < 60).length;
        scoreMap.set(sid, { avg, priorityCount });
      }
    }

    for (const r of mRes.rows) {
      if (r.status === "active" || r.status === "completed") {
        const metrics = scoreMap.get(r.student_id);
        const item = {
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name || "Ayush Scholar",
          program: r.program || null,
          year: r.year || null,
          department: r.department || null,
          status: r.status,
          mentorNote: r.mentor_note || null,
          overallScore: metrics ? metrics.avg : null,
          priorityAreasCount: metrics ? metrics.priorityCount : 0,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };

        if (r.status === "active") {
          activeMentees.push(item);
        } else {
          completedMentees.push(item);
        }
      }
    }

    return {
      pendingRequests,
      activeMentees,
      completedMentees,
    };
  }

  /**
   * Faculty accepts incoming mentorship request.
   * Concurrency protected with row lock on student profile.
   */
  async acceptRequest(facultyUserId: string, mentorshipId: string) {
    const facultyProfile = await this.getUserProfile(facultyUserId);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Fetch mentorship record and lock it
      const mRes = await client.query(
        `SELECT id, faculty_id, student_id, status FROM public.mentorships
         WHERE id = $1 FOR UPDATE`,
        [mentorshipId]
      );

      if (mRes.rows.length === 0) {
        throw new AppError("Mentorship request not found", 404);
      }

      const mentorship = mRes.rows[0];

      if (mentorship.faculty_id !== facultyUserId) {
        throw new AppError("Unauthorized: You can only accept mentorship requests addressed to you.", 403);
      }

      if (mentorship.status !== "pending") {
        throw new AppError(
          `Cannot accept request: current status is '${mentorship.status}'. Only pending requests can be accepted.`,
          400
        );
      }

      // Lock student profile row to serialize concurrent active mentor checks
      await client.query(
        `SELECT id, institution_id FROM public.profiles WHERE id = $1 FOR UPDATE`,
        [mentorship.student_id]
      );

      // Verify same institution
      const sRes = await client.query(
        `SELECT institution_id FROM public.profiles WHERE id = $1`,
        [mentorship.student_id]
      );
      if (!sRes.rows[0]?.institution_id || sRes.rows[0].institution_id !== facultyProfile.institution_id) {
        throw new AppError("Unauthorized: Student does not belong to your affiliated institution.", 403);
      }

      // Check if student already has another active mentor
      const activeCheck = await client.query(
        `SELECT id FROM public.mentorships
         WHERE student_id = $1 AND status = 'active' AND id != $2
         LIMIT 1`,
        [mentorship.student_id, mentorshipId]
      );

      if (activeCheck.rows.length > 0) {
        throw new AppError(
          "Cannot accept request: Student already has an active faculty mentor. A student may have at most one active mentorship at a time.",
          409
        );
      }

      // Transition pending -> active
      const updateRes = await client.query(
        `UPDATE public.mentorships
         SET status = 'active', updated_at = NOW()
         WHERE id = $1
         RETURNING id, faculty_id, student_id, status, updated_at`,
        [mentorshipId]
      );

      await client.query("COMMIT");
      return updateRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Faculty declines incoming mentorship request (pending -> rejected).
   */
  async rejectRequest(facultyUserId: string, mentorshipId: string) {
    const facultyProfile = await this.getUserProfile(facultyUserId);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const mRes = await client.query(
        `SELECT id, faculty_id, student_id, status FROM public.mentorships
         WHERE id = $1 FOR UPDATE`,
        [mentorshipId]
      );

      if (mRes.rows.length === 0) {
        throw new AppError("Mentorship request not found", 404);
      }

      const mentorship = mRes.rows[0];

      if (mentorship.faculty_id !== facultyUserId) {
        throw new AppError("Unauthorized: You can only reject mentorship requests addressed to you.", 403);
      }

      if (mentorship.status !== "pending") {
        throw new AppError(
          `Cannot reject request: current status is '${mentorship.status}'. Only pending requests can be rejected.`,
          400
        );
      }

      const updateRes = await client.query(
        `UPDATE public.mentorships
         SET status = 'rejected', updated_at = NOW()
         WHERE id = $1
         RETURNING id, faculty_id, student_id, status, updated_at`,
        [mentorshipId]
      );

      await client.query("COMMIT");
      return updateRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Faculty directly initiates active mentorship for a cohort student.
   * Concurrency protected with row lock on student profile.
   */
  async initiateMentorship(facultyUserId: string, input: InitiateMentorshipInput) {
    const facultyProfile = await this.getUserProfile(facultyUserId);
    if (!facultyProfile.institution_id) {
      throw new AppError("Your faculty profile must be associated with an institution to initiate mentorship.", 403);
    }

    const studentProfile = await this.getUserProfile(input.studentId);
    if (studentProfile.role !== "student" || !studentProfile.institution_id || studentProfile.institution_id !== facultyProfile.institution_id) {
      throw new AppError("Unauthorized: Student does not belong to your affiliated institution.", 403);
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock student profile
      await client.query(
        `SELECT id FROM public.profiles WHERE id = $1 FOR UPDATE`,
        [input.studentId]
      );

      // 2. Verify student does not have any active mentorship
      const activeCheck = await client.query(
        `SELECT id FROM public.mentorships
         WHERE student_id = $1 AND status = 'active'
         LIMIT 1`,
        [input.studentId]
      );

      if (activeCheck.rows.length > 0) {
        throw new AppError(
          "This student already has an active faculty mentor. A student may have at most one active mentorship at a time.",
          409
        );
      }

      // 3. Verify no pending or active mentorship between this specific pair
      const pairCheck = await client.query(
        `SELECT id, status FROM public.mentorships
         WHERE faculty_id = $1 AND student_id = $2 AND status IN ('pending', 'active')
         LIMIT 1`,
        [facultyUserId, input.studentId]
      );

      if (pairCheck.rows.length > 0) {
        throw new AppError("An active or pending mentorship record already exists for this student.", 409);
      }

      // 4. Insert active mentorship record
      const insertRes = await client.query(
        `INSERT INTO public.mentorships (
           faculty_id, student_id, requested_by, status, request_note, mentor_note
         ) VALUES ($1, $2, $1, 'active', NULL, $3)
         RETURNING id, faculty_id, student_id, status, mentor_note, created_at, updated_at`,
        [facultyUserId, input.studentId, input.mentorNote ? input.mentorNote.trim() : null]
      );

      await client.query("COMMIT");
      return insertRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Faculty updates private mentor guidance notes (active mentee only).
   */
  async updateMentorNote(facultyUserId: string, mentorshipId: string, input: UpdateMentorNoteInput) {
    const mRes = await db.query(
      `SELECT id, faculty_id, status FROM public.mentorships WHERE id = $1`,
      [mentorshipId]
    );

    if (mRes.rows.length === 0) {
      throw new AppError("Mentorship record not found", 404);
    }

    if (mRes.rows[0].faculty_id !== facultyUserId) {
      throw new AppError("Unauthorized: You can only edit notes for your own mentorship records.", 403);
    }

    if (mRes.rows[0].status === "completed" || mRes.rows[0].status === "rejected") {
      throw new AppError("Cannot modify guidance notes for a concluded mentorship.", 400);
    }

    const updateRes = await db.query(
      `UPDATE public.mentorships
       SET mentor_note = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, mentor_note, updated_at`,
      [input.mentorNote.trim(), mentorshipId]
    );

    return updateRes.rows[0];
  }

  /**
   * Faculty marks mentorship as completed (active -> completed).
   */
  async completeMentorship(facultyUserId: string, mentorshipId: string) {
    const mRes = await db.query(
      `SELECT id, faculty_id, status FROM public.mentorships WHERE id = $1`,
      [mentorshipId]
    );

    if (mRes.rows.length === 0) {
      throw new AppError("Mentorship record not found", 404);
    }

    if (mRes.rows[0].faculty_id !== facultyUserId) {
      throw new AppError("Unauthorized: You can only complete your own mentorship records.", 403);
    }

    if (mRes.rows[0].status !== "active") {
      throw new AppError(
        `Cannot complete mentorship: current status is '${mRes.rows[0].status}'. Only active mentorships can be completed.`,
        400
      );
    }

    const updateRes = await db.query(
      `UPDATE public.mentorships
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1
       RETURNING id, faculty_id, student_id, status, updated_at`,
      [mentorshipId]
    );

    return updateRes.rows[0];
  }
}

export const mentorshipService = new MentorshipService();
