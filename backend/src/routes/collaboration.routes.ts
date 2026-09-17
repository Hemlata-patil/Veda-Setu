import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { facultyCollaborationController } from "../controllers/collaboration.controller";

const router = Router();

// =============================================================================
// OPPORTUNITY DISCOVERY & DETAILS
// Authenticated discovery across faculty, institution, and industry roles
// =============================================================================
router.get(
  "/",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.listOpportunities.bind(facultyCollaborationController)
);

router.get(
  "/manage/my-opportunities",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.listMyAuthoredOpportunities.bind(facultyCollaborationController)
);

router.get(
  "/interests/my-interests",
  requireAuth,
  requireRole("faculty"),
  facultyCollaborationController.listMyInterests.bind(facultyCollaborationController)
);

router.get(
  "/:id",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.getOpportunityDetail.bind(facultyCollaborationController)
);

router.post(
  "/",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.createOpportunity.bind(facultyCollaborationController)
);

router.put(
  "/:id",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.updateOpportunityMetadata.bind(facultyCollaborationController)
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.updateOpportunityStatus.bind(facultyCollaborationController)
);

// =============================================================================
// COLLABORATION INTERESTS & APPLICANT MANAGEMENT
// =============================================================================
router.post(
  "/:id/interest",
  requireAuth,
  requireRole("faculty"),
  facultyCollaborationController.expressInterest.bind(facultyCollaborationController)
);

router.put(
  "/interests/:id/message",
  requireAuth,
  requireRole("faculty"),
  facultyCollaborationController.updateInterestMessage.bind(facultyCollaborationController)
);

router.post(
  "/interests/:id/withdraw",
  requireAuth,
  requireRole("faculty"),
  facultyCollaborationController.withdrawInterest.bind(facultyCollaborationController)
);

router.get(
  "/:id/applicants",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.listOpportunityApplicants.bind(facultyCollaborationController)
);

router.patch(
  "/interests/:id/status",
  requireAuth,
  requireRole("faculty", "institution", "industry"),
  facultyCollaborationController.updateApplicantStatus.bind(facultyCollaborationController)
);

export default router;
