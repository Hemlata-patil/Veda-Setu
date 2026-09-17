import { Router } from "express";
import { applicationController } from "../controllers/application.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateParams } from "../middleware/validation.middleware";
import { uuidParamSchema } from "../utils/validation";

const router = Router();

router.use(requireAuth);

/**
 * POST /api/applications/:id/withdraw
 * Student: Withdraw own submitted application
 */
router.post(
  "/:id/withdraw",
  requireRole("student"),
  validateParams(uuidParamSchema),
  applicationController.withdrawApplication.bind(applicationController)
);

/**
 * PATCH /api/applications/:id/cover-note
 * Student: Update cover note while in 'applied' status
 */
router.patch(
  "/:id/cover-note",
  requireRole("student"),
  validateParams(uuidParamSchema),
  applicationController.updateCoverNote.bind(applicationController)
);

export default router;
