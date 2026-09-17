import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { mentorshipController } from "../controllers/mentorship.controller";

const router = Router();

// =============================================================================
// STUDENT MENTORSHIP ENDPOINTS
// =============================================================================
router.get(
  "/student",
  requireAuth,
  requireRole("student"),
  mentorshipController.getStudentDashboard.bind(mentorshipController)
);

router.post(
  "/student/request",
  requireAuth,
  requireRole("student"),
  mentorshipController.requestMentorship.bind(mentorshipController)
);

// =============================================================================
// FACULTY MENTORSHIP ENDPOINTS
// =============================================================================
router.get(
  "/faculty",
  requireAuth,
  requireRole("faculty"),
  mentorshipController.getFacultyDashboard.bind(mentorshipController)
);

router.post(
  "/faculty/requests/:id/accept",
  requireAuth,
  requireRole("faculty"),
  mentorshipController.acceptRequest.bind(mentorshipController)
);

router.post(
  "/faculty/requests/:id/reject",
  requireAuth,
  requireRole("faculty"),
  mentorshipController.rejectRequest.bind(mentorshipController)
);

router.post(
  "/faculty/initiate",
  requireAuth,
  requireRole("faculty"),
  mentorshipController.initiateMentorship.bind(mentorshipController)
);

router.put(
  "/faculty/mentees/:id/note",
  requireAuth,
  requireRole("faculty"),
  mentorshipController.updateMentorNote.bind(mentorshipController)
);

router.post(
  "/faculty/mentees/:id/complete",
  requireAuth,
  requireRole("faculty"),
  mentorshipController.completeMentorship.bind(mentorshipController)
);

export default router;
