import { Router } from "express";
import { profileController } from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { updateProfileSchema } from "../utils/validation";

const router = Router();

// All profile routes require authentication
router.use(requireAuth);

/**
 * GET /api/profile
 * Get caller's own profile metadata
 */
router.get("/", profileController.getProfile.bind(profileController));

/**
 * PUT /api/profile
 * Update caller's own profile metadata (strict validation and role immutability)
 */
router.put(
  "/",
  validateBody(updateProfileSchema),
  profileController.updateProfile.bind(profileController)
);

export default router;
