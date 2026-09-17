import { Request, Response, NextFunction } from "express";
import { studentCompetencyService } from "../services/student-competency.service";
import { AppError } from "../middleware/error.middleware";

export class StudentCompetencyController {
  /**
   * GET /api/students/me/competencies
   * Student views their own competency results.
   */
  async getMyCompetencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new AppError("Authentication required.", 401);
      }

      const competencies = await studentCompetencyService.getStudentCompetencies(req.user.userId);

      res.status(200).json({
        status: "success",
        results: competencies.length,
        data: { competencies },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const studentCompetencyController = new StudentCompetencyController();
