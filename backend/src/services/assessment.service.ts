import { db } from "../db";
import { AppError } from "../middleware/error.middleware";

export interface AssessmentTemplateSummary {
  id: string;
  title: string;
  description: string | null;
  program: string | null;
  year: number | null;
  status: string;
  published_at: string | null;
  question_count?: number;
}

export interface StudentSafeQuestion {
  id: string;
  assessment_template_id: string;
  competency_id: string;
  question: string;
  question_type: "mcq" | "self_rating";
  weight: number;
  max_score: number;
  options: any;
  difficulty: string | null;
  source: string | null;
  source_reference: string | null;
}

export interface AssessmentAttemptDetail {
  id: string;
  assessment_template_id: string;
  student_id: string;
  status: "not_started" | "in_progress" | "submitted" | "expired";
  started_at: string | null;
  submitted_at: string | null;
  total_score: number | null;
  template_title: string;
  answers?: Array<{
    question_id: string;
    answer_value: number | null;
    answer_text: string | null;
  }>;
}

export interface AnswerPayload {
  questionId: string;
  answerValue?: number | null;
  answerText?: string | null;
}

export interface CompletionResult {
  attemptId: string;
  totalScore: number;
  submittedAt: string;
  competencyScores: Array<{
    competencyId: string;
    competencyName: string;
    category: string;
    score: number;
  }>;
}

export class AssessmentService {
  /**
   * Retrieve published assessment templates.
   * Safe for authenticated learners and academic viewers.
   */
  async getPublishedTemplates(): Promise<AssessmentTemplateSummary[]> {
    const res = await db.query<AssessmentTemplateSummary>(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.program,
         t.year,
         t.status,
         t.published_at,
         COUNT(q.id)::int AS question_count
       FROM public.assessment_templates t
       LEFT JOIN public.assessment_questions q
         ON q.assessment_template_id = t.id AND q.is_active = true
       WHERE t.status = 'published'
       GROUP BY t.id
       ORDER BY t.created_at ASC`
    );
    return res.rows;
  }

  /**
   * Retrieve a single assessment template by ID (must be published).
   */
  async getTemplateById(templateId: string): Promise<AssessmentTemplateSummary> {
    const res = await db.query<AssessmentTemplateSummary>(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.program,
         t.year,
         t.status,
         t.published_at,
         COUNT(q.id)::int AS question_count
       FROM public.assessment_templates t
       LEFT JOIN public.assessment_questions q
         ON q.assessment_template_id = t.id AND q.is_active = true
       WHERE t.id = $1 AND t.status = 'published'
       GROUP BY t.id`,
      [templateId]
    );

    if (res.rows.length === 0) {
      throw new AppError("Assessment template not found or not published.", 404);
    }

    return res.rows[0];
  }

  /**
   * Retrieve questions for a published assessment template.
   * CRITICAL SECURITY SAFEGUARD:
   * STRICTLY returns student-safe question columns.
   * NEVER joins or exposes assessment_question_keys.
   */
  async getAssessmentQuestions(templateId: string): Promise<StudentSafeQuestion[]> {
    // 1. Verify template exists and is published
    await this.getTemplateById(templateId);

    // 2. Query questions strictly selecting student-safe fields
    const res = await db.query<StudentSafeQuestion>(
      `SELECT
         id,
         assessment_template_id,
         competency_id,
         question,
         question_type,
         weight,
         max_score,
         options,
         difficulty,
         source,
         source_reference
       FROM public.assessment_questions
       WHERE assessment_template_id = $1 AND is_active = true
       ORDER BY created_at ASC`,
      [templateId]
    );

    return res.rows;
  }

  /**
   * Start or resume an assessment attempt for an authenticated student.
   * Enforces template published status and transitions attempt to 'in_progress'.
   */
  async startAttempt(studentId: string, templateId: string): Promise<{ attemptId: string; status: string }> {
    // 1. Check template is published
    await this.getTemplateById(templateId);

    // 2. Check for existing attempt
    const existing = await db.query<{ id: string; status: string }>(
      `SELECT id, status FROM public.assessment_attempts
       WHERE student_id = $1 AND assessment_template_id = $2`,
      [studentId, templateId]
    );

    if (existing.rows.length > 0) {
      const attempt = existing.rows[0];
      if (attempt.status === "not_started") {
        await db.query(
          `UPDATE public.assessment_attempts
           SET status = 'in_progress', started_at = NOW()
           WHERE id = $1`,
          [attempt.id]
        );
        return { attemptId: attempt.id, status: "in_progress" };
      }
      return { attemptId: attempt.id, status: attempt.status };
    }

    // 3. Create new attempt in in_progress state with started_at = NOW()
    const insertRes = await db.query<{ id: string; status: string }>(
      `INSERT INTO public.assessment_attempts (
         assessment_template_id,
         student_id,
         status,
         started_at
       ) VALUES ($1, $2, 'in_progress', NOW())
       RETURNING id, status`,
      [templateId, studentId]
    );

    return {
      attemptId: insertRes.rows[0].id,
      status: insertRes.rows[0].status,
    };
  }

  /**
   * Retrieve attempt details.
   * Enforces student ownership: student can ONLY retrieve their own attempt.
   */
  async getAttempt(attemptId: string, studentId: string): Promise<AssessmentAttemptDetail> {
    const attemptRes = await db.query<any>(
      `SELECT
         a.id,
         a.assessment_template_id,
         a.student_id,
         a.status,
         a.started_at,
         a.submitted_at,
         a.total_score,
         t.title AS template_title
       FROM public.assessment_attempts a
       JOIN public.assessment_templates t ON t.id = a.assessment_template_id
       WHERE a.id = $1`,
      [attemptId]
    );

    if (attemptRes.rows.length === 0) {
      throw new AppError("Assessment attempt not found.", 404);
    }

    const attempt = attemptRes.rows[0];

    // Ownership check
    if (attempt.student_id !== studentId) {
      throw new AppError("Access denied. You do not own this assessment attempt.", 403);
    }

    // Load submitted answers
    const answersRes = await db.query<{
      question_id: string;
      answer_value: number | null;
      answer_text: string | null;
    }>(
      `SELECT question_id, answer_value, answer_text
       FROM public.assessment_answers
       WHERE attempt_id = $1`,
      [attemptId]
    );

    attempt.answers = answersRes.rows;
    return attempt;
  }

  /**
   * Retrieve caller's attempt for a specific assessment template without mutating state.
   * Student only.
   */
  async getStudentAttemptForTemplate(
    studentId: string,
    templateId: string
  ): Promise<{
    id: string;
    status: string;
    total_score: number | null;
    submitted_at: string | null;
  } | null> {
    const res = await db.query<{
      id: string;
      status: string;
      total_score: number | null;
      submitted_at: string | null;
    }>(
      `SELECT id, status, total_score, submitted_at
       FROM public.assessment_attempts
       WHERE student_id = $1 AND assessment_template_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId, templateId]
    );

    return res.rows[0] || null;
  }

  /**
   * Save / Upsert answers for an in-progress attempt.
   * Validates:
   * 1. Student ownership
   * 2. Attempt is currently 'in_progress' (rejects modification of submitted/completed attempts)
   * 3. Question belongs to attempt's template and is active
   */
  async saveAnswers(
    attemptId: string,
    studentId: string,
    answers: AnswerPayload[]
  ): Promise<{ savedCount: number }> {
    // 1. Verify attempt ownership & in_progress status
    const attemptRes = await db.query<{
      id: string;
      student_id: string;
      assessment_template_id: string;
      status: string;
    }>(
      `SELECT id, student_id, assessment_template_id, status
       FROM public.assessment_attempts
       WHERE id = $1`,
      [attemptId]
    );

    if (attemptRes.rows.length === 0) {
      throw new AppError("Assessment attempt not found.", 404);
    }

    const attempt = attemptRes.rows[0];

    if (attempt.student_id !== studentId) {
      throw new AppError("Access denied. You do not own this assessment attempt.", 403);
    }

    if (attempt.status !== "in_progress") {
      throw new AppError(
        `Cannot modify attempt. Current status is '${attempt.status}'. Only 'in_progress' attempts accept answers.`,
        400
      );
    }

    // 2. Fetch valid active question IDs for this template to avoid invalid question injection
    const validQuestionsRes = await db.query<{ id: string }>(
      `SELECT id FROM public.assessment_questions
       WHERE assessment_template_id = $1 AND is_active = true`,
      [attempt.assessment_template_id]
    );
    const validQuestionIds = new Set(validQuestionsRes.rows.map((q) => q.id));

    for (const ans of answers) {
      if (!validQuestionIds.has(ans.questionId)) {
        throw new AppError(
          `Invalid question ID '${ans.questionId}' for this assessment template.`,
          400
        );
      }
    }

    // 3. Upsert answers transactionally
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      for (const ans of answers) {
        await client.query(
          `INSERT INTO public.assessment_answers (
             attempt_id,
             question_id,
             assessment_template_id,
             answer_value,
             answer_text
           ) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (attempt_id, question_id) DO UPDATE SET
             answer_value = EXCLUDED.answer_value,
             answer_text = EXCLUDED.answer_text`,
          [
            attemptId,
            ans.questionId,
            attempt.assessment_template_id,
            ans.answerValue ?? null,
            ans.answerText ?? null,
          ]
        );
      }

      await client.query("COMMIT");
      return { savedCount: answers.length };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Complete an assessment attempt and compute competency results.
   *
   * TRANSACTIONAL FLOW:
   * BEGIN
   *  1. Lock attempt row FOR UPDATE, verify student ownership and status = 'in_progress'
   *  2. Load all active questions for this template
   *  3. Load student answers for this attempt
   *  4. Load protected keys from assessment_question_keys (Privileged internal access ONLY)
   *  5. Execute exact scoring formula:
   *     - MCQ: 80% weight (100 if answer equals key value, else 0)
   *     - Self-Rating: 20% weight (1:20, 2:40, 3:60, 4:80, 5:100)
   *     - Final competency score = round(0.8 * mcqScore + 0.2 * selfRatingScore)
   *     - Overall score = round(average of competency scores)
   *  6. Upsert results into public.student_competencies
   *  7. Update public.assessment_attempts (status = 'submitted', total_score, submitted_at = NOW())
   * COMMIT
   */
  async completeAttempt(attemptId: string, studentId: string): Promise<CompletionResult> {
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Lock and verify attempt
      const attemptRes = await client.query<{
        id: string;
        student_id: string;
        assessment_template_id: string;
        status: string;
      }>(
        `SELECT id, student_id, assessment_template_id, status
         FROM public.assessment_attempts
         WHERE id = $1
         FOR UPDATE`,
        [attemptId]
      );

      if (attemptRes.rows.length === 0) {
        throw new AppError("Assessment attempt not found.", 404);
      }

      const attempt = attemptRes.rows[0];

      if (attempt.student_id !== studentId) {
        throw new AppError("Access denied. You do not own this assessment attempt.", 403);
      }

      if (attempt.status !== "in_progress") {
        throw new AppError(
          `Cannot complete assessment. Attempt status is '${attempt.status}'. Only 'in_progress' attempts can be submitted.`,
          400
        );
      }

      // 2. Load all active questions for this template joined with competency metadata
      const questionsRes = await client.query<{
        id: string;
        competency_id: string;
        question_type: "mcq" | "self_rating";
        weight: number;
        max_score: number;
        competency_name: string;
        competency_category: string;
      }>(
        `SELECT
           q.id,
           q.competency_id,
           q.question_type,
           q.weight,
           q.max_score,
           c.name AS competency_name,
           c.category AS competency_category
         FROM public.assessment_questions q
         JOIN public.competencies c ON c.id = q.competency_id
         WHERE q.assessment_template_id = $1 AND q.is_active = true`,
        [attempt.assessment_template_id]
      );

      if (questionsRes.rows.length === 0) {
        throw new AppError("No active questions found for this assessment template.", 400);
      }

      const questions = questionsRes.rows;

      // 3. Load student answers
      const answersRes = await client.query<{
        question_id: string;
        answer_value: number | null;
        answer_text: string | null;
      }>(
        `SELECT question_id, answer_value, answer_text
         FROM public.assessment_answers
         WHERE attempt_id = $1`,
        [attemptId]
      );

      const answersMap = new Map(answersRes.rows.map((a) => [a.question_id, a]));

      // 4. Load protected question keys (Internal server-side scoring only)
      const questionIds = questions.map((q) => q.id);
      const keysRes = await client.query<{
        question_id: string;
        correct_answer: any;
      }>(
        `SELECT question_id, correct_answer
         FROM public.assessment_question_keys
         WHERE question_id = ANY($1::uuid[])`,
        [questionIds]
      );

      const keysMap = new Map(keysRes.rows.map((k) => [k.question_id, k.correct_answer]));

      // 5. Scoring Calculation
      // 5-point self rating mapping: 1=20, 2=40, 3=60, 4=80, 5=100
      const selfRatingScaleMap: Record<number, number> = {
        1: 20,
        2: 40,
        3: 60,
        4: 80,
        5: 100,
      };

      // Group questions by competency
      const competencyGroups = new Map<string, typeof questions>();
      for (const q of questions) {
        const group = competencyGroups.get(q.competency_id) || [];
        group.push(q);
        competencyGroups.set(q.competency_id, group);
      }

      const competencyResults: Array<{
        competencyId: string;
        competencyName: string;
        category: string;
        score: number;
      }> = [];

      let totalScoreSum = 0;

      for (const [compId, group] of competencyGroups.entries()) {
        let mcqScore = 0;
        let selfRatingScore = 0;
        const compName = group[0].competency_name;
        const compCategory = group[0].competency_category;

        for (const q of group) {
          const studentAns = answersMap.get(q.id);

          if (q.question_type === "mcq") {
            const correctKey = keysMap.get(q.id);
            const correctVal =
              typeof correctKey === "object" && correctKey !== null
                ? (correctKey as any).value
                : correctKey;
            const studentVal = studentAns?.answer_text || studentAns?.answer_value;

            if (
              studentVal &&
              correctVal &&
              String(studentVal).trim().toUpperCase() === String(correctVal).trim().toUpperCase()
            ) {
              mcqScore = 100;
            } else {
              mcqScore = 0;
            }
          } else if (q.question_type === "self_rating") {
            const rawRating = Number(studentAns?.answer_value || 0);
            selfRatingScore = selfRatingScaleMap[rawRating] || 0;
          }
        }

        // Weighted formula: 80% MCQ + 20% Self-Rating
        const finalCompScore = Math.round(0.8 * mcqScore + 0.2 * selfRatingScore);
        competencyResults.push({
          competencyId: compId,
          competencyName: compName,
          category: compCategory,
          score: finalCompScore,
        });

        totalScoreSum += finalCompScore;
      }

      const overallScore =
        competencyResults.length > 0
          ? Math.round(totalScoreSum / competencyResults.length)
          : 0;

      // 6. Upsert into public.student_competencies
      for (const cr of competencyResults) {
        await client.query(
          `INSERT INTO public.student_competencies (
             student_id,
             competency_id,
             proficiency_score,
             last_assessed_at,
             source,
             verified
           ) VALUES ($1, $2, $3, NOW(), 'Platform Assessment: Ayush Skill & Competency Assessment', false)
           ON CONFLICT (student_id, competency_id) DO UPDATE SET
             proficiency_score = EXCLUDED.proficiency_score,
             last_assessed_at = EXCLUDED.last_assessed_at,
             source = EXCLUDED.source`,
          [studentId, cr.competencyId, cr.score]
        );
      }

      // 7. Update attempt to submitted with total score
      const now = new Date().toISOString();
      await client.query(
        `UPDATE public.assessment_attempts
         SET status = 'submitted',
             total_score = $1,
             submitted_at = NOW()
         WHERE id = $2`,
        [overallScore, attemptId]
      );

      await client.query("COMMIT");

      return {
        attemptId,
        totalScore: overallScore,
        submittedAt: now,
        competencyScores: competencyResults,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

export const assessmentService = new AssessmentService();
