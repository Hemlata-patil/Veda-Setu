import { Router } from "express";
import { studentCompetencyController } from "../controllers/student-competency.controller";
import { applicationController } from "../controllers/application.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Student role only for /api/students routes
router.use(requireAuth);
router.use(requireRole("student"));

// GET /api/students/me/competencies
router.get("/me/competencies", (req, res, next) =>
  studentCompetencyController.getMyCompetencies(req, res, next)
);

// GET /api/students/me/applications
router.get("/me/applications", (req, res, next) =>
  applicationController.getStudentApplications(req, res, next)
);

export default router;
