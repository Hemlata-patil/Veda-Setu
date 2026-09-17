import { Router } from "express";
import { metadataController } from "../controllers/metadata.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Core metadata endpoints (Read access for authenticated users across all roles)
router.get("/institutions", requireAuth, (req, res, next) => metadataController.getInstitutions(req, res, next));
router.get("/organizations", requireAuth, (req, res, next) => metadataController.getOrganizations(req, res, next));
router.get("/skills", requireAuth, (req, res, next) => metadataController.getSkills(req, res, next));
router.get("/competencies", requireAuth, (req, res, next) => metadataController.getCompetencies(req, res, next));

export default router;
