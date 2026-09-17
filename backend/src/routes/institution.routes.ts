import { Router } from "express";
import { institutionController } from "../controllers/institution.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validateBody, validateParams } from "../middleware/validation.middleware";
import { uuidParamSchema, createFacultySchema } from "../utils/validation";

const router = Router();

// All institution routes require authentication and 'institution' role
router.use(requireAuth);
router.use(requireRole("institution"));

/**
 * GET /api/institution/dashboard
 * Institution dashboard metrics
 */
router.get("/dashboard", institutionController.getDashboard.bind(institutionController));

/**
 * GET /api/institution/faculty
 * Roster of faculty members affiliated with the institution
 */
router.get("/faculty", institutionController.getFacultyDirectory.bind(institutionController));

/**
 * POST /api/institution/faculty
 * Provision new faculty account (atomic transaction in users + profiles)
 */
router.post(
  "/faculty",
  validateBody(createFacultySchema),
  institutionController.provisionFaculty.bind(institutionController)
);

/**
 * GET /api/institution/students
 * List of students affiliated with this institution
 */
router.get("/students", institutionController.getStudentDirectory.bind(institutionController));

/**
 * GET /api/institution/students/:id
 * Student academic & competency profile (strictly scoped to same institution)
 */
router.get(
  "/students/:id",
  validateParams(uuidParamSchema),
  institutionController.getStudentDetail.bind(institutionController)
);

/**
 * GET /api/institution/analytics
 * Aggregate cohort benchmarks and application pipeline counts
 */
router.get("/analytics", institutionController.getAnalytics.bind(institutionController));

/**
 * GET /api/institution/internship-placement
 * Placement records for all students affiliated with this institution
 */
router.get("/internship-placement", institutionController.getInternshipPlacements.bind(institutionController));

export default router;
