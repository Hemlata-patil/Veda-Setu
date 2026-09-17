import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { placementController } from "../controllers/placement.controller";

const router = Router();

// Student routes
router.get(
  "/student",
  requireAuth,
  requireRole("student"),
  placementController.getStudentPlacements.bind(placementController)
);

// Industry routes
router.get(
  "/industry",
  requireAuth,
  requireRole("industry"),
  placementController.getIndustryPlacements.bind(placementController)
);

router.post(
  "/",
  requireAuth,
  requireRole("industry"),
  placementController.createPlacementTracking.bind(placementController)
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("industry"),
  placementController.updatePlacementTracking.bind(placementController)
);

// Institution routes
router.get(
  "/institution",
  requireAuth,
  requireRole("institution"),
  placementController.getInstitutionPlacements.bind(placementController)
);

// Single placement detail (role authorized inside service)
router.get(
  "/:id",
  requireAuth,
  placementController.getPlacementById.bind(placementController)
);

export default router;
