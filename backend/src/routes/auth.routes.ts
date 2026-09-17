import { Router } from "express";
import { register, login, logout, getMe, forgotPassword, resetPassword, updatePassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Public Authentication Endpoints
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected Authentication Endpoints
router.get("/me", requireAuth, getMe);
router.post("/update-password", requireAuth, updatePassword);

export default router;
