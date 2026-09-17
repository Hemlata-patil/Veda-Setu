import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { superAdminController } from "../controllers/super-admin.controller";

const router = Router();

// Strict security: all endpoints require valid auth and super_admin role
router.use(requireAuth, requireRole("super_admin"));

// 1. Dashboard
router.get("/dashboard", (req, res, next) => superAdminController.getDashboard(req, res, next));

// 2. Institutions
router.get("/institutions", (req, res, next) => superAdminController.getInstitutions(req, res, next));
router.post("/institutions", (req, res, next) => superAdminController.createInstitutionWithAdmin(req, res, next));
router.patch("/institutions/:id/status", (req, res, next) => superAdminController.updateInstitutionStatus(req, res, next));

// 3. Industries & Organizations
router.get("/industries", (req, res, next) => superAdminController.getOrganizations(req, res, next));
router.post("/industries", (req, res, next) => superAdminController.createIndustryWithAdmin(req, res, next));
router.patch("/industries/:id/status", (req, res, next) => superAdminController.updateOrganizationStatus(req, res, next));

// 4. Users
router.get("/users", (req, res, next) => superAdminController.getUsers(req, res, next));
router.patch("/users/:id/role", (req, res, next) => superAdminController.updateUserRole(req, res, next));

// 5. Opportunities Moderation
router.get("/opportunities", (req, res, next) => superAdminController.getOpportunities(req, res, next));
router.patch("/opportunities/:id/status", (req, res, next) => superAdminController.moderateOpportunityStatus(req, res, next));

// 6. Platform Analytics
router.get("/analytics", (req, res, next) => superAdminController.getAnalytics(req, res, next));

export default router;
