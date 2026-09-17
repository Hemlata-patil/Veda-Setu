import { Router } from "express";
import { opportunityController } from "../controllers/opportunity.controller";
import { applicationController } from "../controllers/application.controller";
import { industryController } from "../controllers/industry.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validation.middleware";
import {
  uuidParamSchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  updateOpportunityStatusSchema,
  updateApplicationStatusSchema,
} from "../utils/validation";

const router = Router();

// All industry routes require authentication and 'industry' role
router.use(requireAuth);
router.use(requireRole("industry"));

// =============================================================================
// Industry Dashboard
// =============================================================================

/**
 * GET /api/industry/dashboard
 * Industry dashboard metrics and recent opportunities
 */
router.get(
  "/dashboard",
  industryController.getDashboard.bind(industryController)
);

// =============================================================================
// Opportunity Management
// =============================================================================

/**
 * GET /api/industry/opportunities
 * List all opportunities created by the authenticated industry partner
 */
router.get(
  "/opportunities",
  opportunityController.getIndustryOpportunities.bind(opportunityController)
);

/**
 * POST /api/industry/opportunities
 * Create a new opportunity with competency requirements (atomic transaction)
 */
router.post(
  "/opportunities",
  validateBody(createOpportunitySchema),
  opportunityController.createOpportunity.bind(opportunityController)
);

/**
 * GET /api/industry/opportunities/:id
 * View details of an opportunity owned by the industry partner
 */
router.get(
  "/opportunities/:id",
  validateParams(uuidParamSchema),
  opportunityController.getIndustryOpportunityDetail.bind(opportunityController)
);

/**
 * PUT /api/industry/opportunities/:id
 * Update an opportunity and replace its required competencies (atomic transaction)
 */
router.put(
  "/opportunities/:id",
  validateParams(uuidParamSchema),
  validateBody(updateOpportunitySchema),
  opportunityController.updateOpportunity.bind(opportunityController)
);

/**
 * PATCH /api/industry/opportunities/:id/status
 * Transition status of an opportunity (draft, published, closed, archived)
 */
router.patch(
  "/opportunities/:id/status",
  validateParams(uuidParamSchema),
  validateBody(updateOpportunityStatusSchema),
  opportunityController.updateOpportunityStatus.bind(opportunityController)
);

/**
 * DELETE /api/industry/opportunities/:id
 * Delete an opportunity if no candidate applications exist
 */
router.delete(
  "/opportunities/:id",
  validateParams(uuidParamSchema),
  opportunityController.deleteOpportunity.bind(opportunityController)
);

// =============================================================================
// Candidate Application Review & Lifecycle
// =============================================================================

/**
 * GET /api/industry/opportunities/:id/applications
 * List applicants for a specific opportunity
 */
router.get(
  "/opportunities/:id/applications",
  validateParams(uuidParamSchema),
  applicationController.getOpportunityApplicants.bind(applicationController)
);

/**
 * GET /api/industry/applications
 * List all candidate applications across all opportunities created by the industry partner
 */
router.get(
  "/applications",
  applicationController.getIndustryApplications.bind(applicationController)
);

/**
 * GET /api/industry/applications/:id
 * Review a candidate's application details and competency alignment
 */
router.get(
  "/applications/:id",
  validateParams(uuidParamSchema),
  applicationController.getCandidateReview.bind(applicationController)
);

/**
 * PATCH /api/industry/applications/:id/status
 * Transition candidate application status according to the state machine
 */
router.patch(
  "/applications/:id/status",
  validateParams(uuidParamSchema),
  validateBody(updateApplicationStatusSchema),
  applicationController.updateCandidateStatus.bind(applicationController)
);

export default router;
