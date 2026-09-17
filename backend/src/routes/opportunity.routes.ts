import { Router } from "express";
import { opportunityController } from "../controllers/opportunity.controller";
import { applicationController } from "../controllers/application.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validation.middleware";
import {
  uuidParamSchema,
  applyOpportunitySchema,
} from "../utils/validation";

const router = Router();

// All opportunity routes require authentication
router.use(requireAuth);

/**
 * GET /api/opportunities
 * Student: Browse published opportunities with real-time competency matching
 */
router.get(
  "/",
  requireRole("student"),
  opportunityController.getPublishedOpportunities.bind(opportunityController)
);

/**
 * GET /api/opportunities/:id
 * Student: View single published opportunity details with requirement breakdown
 */
router.get(
  "/:id",
  requireRole("student"),
  validateParams(uuidParamSchema),
  opportunityController.getOpportunityDetail.bind(opportunityController)
);

/**
 * POST /api/opportunities/:id/applications
 * Student: Apply to a published opportunity
 */
router.post(
  "/:id/applications",
  requireRole("student"),
  validateParams(uuidParamSchema),
  validateBody(applyOpportunitySchema),
  applicationController.applyToOpportunity.bind(applicationController)
);

export default router;
