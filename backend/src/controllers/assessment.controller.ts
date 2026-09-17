import { Request, Response, NextFunction } from "express";
import { assessmentService } from "../services/assessment.service";
import { AppError } from "../middleware/error.middleware";

export class AssessmentController {
  /**
   * GET /api/assessments
   * List published assessment templates
   */
  async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await assessmentService.getPublishedTemplates();
      res.status(200).json({
        status: "success",
        results: templates.length,
        data: { assessments: templates },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id
   * Get single published assessment template details
   */
  async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const template = await assessmentService.getTemplateById(id);
      res.status(200).json({
        status: "success",
        data: { assessment: template },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id/questions
   * Get student-safe questions for an assessment.
   * STRICT SECURITY: Never returns correct answers or answer keys.
   */
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const questions = await assessmentService.getAssessmentQuestions(id);
      res.status(200).json({
        status: "success",
        results: questions.length,
        data: { questions },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/assessments/:id/attempts
   * Start or resume an assessment attempt.
   * Student only; student ID derived from JWT.
   */
  async startAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError("Authentication required.", 401);
      }

      const { id: templateId } = req.params;
      const result = await assessmentService.startAttempt(req.user.userId, templateId);

      res.status(201).json({
        status: "success",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/attempts/:attemptId
   * Retrieve attempt details and submitted answers.
   * Student only; strictly verifies student ownership.
   */
  async getAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError("Authentication required.", 401);
      }

      const { attemptId } = req.params;
      const attempt = await assessmentService.getAttempt(attemptId, req.user.userId);

      res.status(200).json({
        status: "success",
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/assessments/:id/my-attempt
   * Retrieve student's attempt status for a template (read-only, no mutation).
   * Student only; student ID derived from JWT.
   */
  async getMyAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError("Authentication required.", 401);
      }

      const { id: templateId } = req.params;
      const attempt = await assessmentService.getStudentAttemptForTemplate(
        req.user.userId,
        templateId
      );

      res.status(200).json({
        status: "success",
        data: { attempt },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/assessments/attempts/:attemptId/answers
   * Save / Upsert answers for an in-progress attempt.
   * Student only; strictly verifies student ownership.
   */
  async saveAnswers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError("Authentication required.", 401);
      }

      const { attemptId } = req.params;

      // Support either single answer or batch answers
      let answersToSave = req.body.answers;
      if (!answersToSave && req.body.questionId) {
        answersToSave = [
          {
            questionId: req.body.questionId,
            answerValue: req.body.answerValue,
            answerText: req.body.answerText,
          },
        ];
      }

      if (!answersToSave || !Array.isArray(answersToSave) || answersToSave.length === 0) {
        throw new AppError("Payload must include 'questionId' or an 'answers' array.", 400);
      }

      const result = await assessmentService.saveAnswers(attemptId, req.user.userId, answersToSave);

      res.status(200).json({
        status: "success",
        message: "Answers saved successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/assessments/attempts/:attemptId/complete
   * Complete assessment attempt, compute score, and update student competencies.
   * Student only; strictly verifies student ownership.
   */
  async completeAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError("Authentication required.", 401);
      }

      const { attemptId } = req.params;
      const result = await assessmentService.completeAttempt(attemptId, req.user.userId);

      res.status(200).json({
        status: "success",
        message: "Assessment completed and scored successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const assessmentController = new AssessmentController();
