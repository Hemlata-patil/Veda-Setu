import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import metadataRoutes from "./metadata.routes";
import assessmentRoutes from "./assessment.routes";
import studentRoutes from "./student.routes";
import opportunityRoutes from "./opportunity.routes";
import applicationRoutes from "./application.routes";
import industryRoutes from "./industry.routes";
import facultyRoutes from "./faculty.routes";
import institutionRoutes from "./institution.routes";
import profileRoutes from "./profile.routes";
import mentorshipRoutes from "./mentorship.routes";
import collaborationRoutes from "./collaboration.routes";
import placementRoutes from "./placement.routes";
import portfolioRoutes from "./portfolio.routes";
import superAdminRoutes from "./super-admin.routes";

const router = Router();

// 1. Health Check
router.use("/health", healthRoutes);

// 2. Authentication & Identity
router.use("/auth", authRoutes);

// 3. Core Metadata (institutions, organizations, skills, competencies)
router.use("/", metadataRoutes);

// 4. Assessments
router.use("/assessments", assessmentRoutes);

// 5. Students (Student Competencies & My Applications)
router.use("/students", studentRoutes);

// 6. Opportunities (Student Browsing & Application Submission)
router.use("/opportunities", opportunityRoutes);

// 7. Applications (Student Application Lifecycle Actions)
router.use("/applications", applicationRoutes);

// 8. Industry (Opportunity Management & Candidate Review)
router.use("/industry", industryRoutes);

// 9. Faculty (Dashboard, Cohort Students, Student Audit)
router.use("/faculty", facultyRoutes);

// 10. Institution (Dashboard, Directories, Faculty Provisioning, Analytics)
router.use("/institution", institutionRoutes);

// 11. Profile (Current User Profile & Verified Updates)
router.use("/profile", profileRoutes);

// 12. Mentorship (Student & Faculty 1-on-1 Guidance)
router.use("/mentorship", mentorshipRoutes);

// 13. Faculty Collaboration (FDP, Research, Industry Initiatives & Interests)
router.use("/faculty-collaboration", collaborationRoutes);

// 14. Placements (Internship & Career Placement Tracking)
router.use("/placements", placementRoutes);

// 15. Portfolio (Student Digital Portfolio Items & Documentary Evidence)
router.use("/portfolio", portfolioRoutes);

// 16. Super Admin (Governance, Verification, Global Oversight & Analytics)
router.use("/super-admin", superAdminRoutes);

export default router;
