import { Request, Response, NextFunction } from "express";
import { industryService } from "../services/industry.service";

export class IndustryController {
  /**
   * GET /api/industry/dashboard
   * Fetch dashboard metrics and recent opportunities for the authenticated industry user
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const industryUserId = req.user!.userId;
      const dashboard = await industryService.getIndustryDashboard(industryUserId);
      res.status(200).json({
        status: "success",
        data: dashboard,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const industryController = new IndustryController();
