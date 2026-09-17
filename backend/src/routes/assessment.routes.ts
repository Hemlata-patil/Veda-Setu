import { Router } from "express";
import { assessmentController } from "../controllers/assessment.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateParams } from "../middleware/validation.middleware";
import { uuidParamSchema, attemptParamSchema } from "../utils/validation";

const router = Router();

// 1. Published assessments list & detail (accessible to any authenticated role)
router.get("/", requireAuth, (req, res, next) => assessmentController.getTemplates(req, res, next));
router.get("/:id", requireAuth, validateParams(uuidParamSchema), (req, res, next) =>
  assessmentController.getTemplateById(req, res, next)
);

// 2. Questions for published assessment (Student-safe: No answer keys exposed)
router.get("/:id/questions", requireAuth, validateParams(uuidParamSchema), (req, res, next) =>
  assessmentController.getQuestions(req, res, next)
);

// 2.1 Read-only attempt status check for dashboard (Student role only)
router.get(
  "/:id/my-attempt",
  requireAuth,
  requireRole("student"),
  validateParams(uuidParamSchema),
  (req, res, next) => assessmentController.getMyAttempt(req, res, next)
);

// 3. Start attempt (Student role only)
router.post(
  "/:id/attempts",
  requireAuth,
  requireRole("student"),
  validateParams(uuidParamSchema),
  (req, res, next) => assessmentController.startAttempt(req, res, next)
);

// 4. Retrieve student's own attempt (Student role only)
router.get(
  "/attempts/:attemptId",
  requireAuth,
  requireRole("student"),
  validateParams(attemptParamSchema),
  (req, res, next) => assessmentController.getAttempt(req, res, next)
);

// 5. Submit/save answers for in-progress attempt (Student role only)
router.post(
  "/attempts/:attemptId/answers",
  requireAuth,
  requireRole("student"),
  validateParams(attemptParamSchema),
  (req, res, next) => assessmentController.saveAnswers(req, res, next)
);

// 6. Complete and score attempt (Student role only)
router.post(
  "/attempts/:attemptId/complete",
  requireAuth,
  requireRole("student"),
  validateParams(attemptParamSchema),
  (req, res, next) => assessmentController.completeAttempt(req, res, next)
);

export default router;
