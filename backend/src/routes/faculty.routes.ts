import { Router } from "express";
import { facultyController } from "../controllers/faculty.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateParams } from "../middleware/validation.middleware";
import { uuidParamSchema } from "../utils/validation";

const router = Router();

// All faculty routes require authentication and 'faculty' role
router.use(requireAuth);
router.use(requireRole("faculty"));

/**
 * GET /api/faculty/dashboard
 * Faculty dashboard metrics and cohort overview
 */
router.get("/dashboard", facultyController.getDashboard.bind(facultyController));

/**
 * GET /api/faculty/students
 * Institution cohort student directory with competency summaries
 */
router.get("/students", facultyController.getInstitutionStudents.bind(facultyController));

/**
 * GET /api/faculty/students/:id
 * Individual student competency & skill profile (strictly scoped to same institution)
 */
router.get(
  "/students/:id",
  validateParams(uuidParamSchema),
  facultyController.getStudentDetail.bind(facultyController)
);

export default router;
