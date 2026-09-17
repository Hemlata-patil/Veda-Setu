import { Request, Response, NextFunction } from "express";
import { profileService } from "../services/profile.service";

export class ProfileController {
  /**
   * GET /api/profile
   * Get current authenticated user's profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await profileService.getProfile(userId);
      res.status(200).json({
        status: "success",
        data: { profile },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/profile
   * Update current user's profile metadata
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const profile = await profileService.updateProfile(userId, userRole, req.body);
      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        data: { profile },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();
