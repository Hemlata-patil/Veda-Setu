import { Request, Response, NextFunction } from "express";
import { facultyService } from "../services/faculty.service";

export class FacultyController {
  /**
   * GET /api/faculty/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyUserId = req.user!.userId;
      const dashboard = await facultyService.getDashboard(facultyUserId);
      res.status(200).json({
        status: "success",
        data: dashboard,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/faculty/students
   */
  async getInstitutionStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyUserId = req.user!.userId;
      const students = await facultyService.getInstitutionStudents(facultyUserId);
      res.status(200).json({
        status: "success",
        results: students.length,
        data: { students },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/faculty/students/:id
   */
  async getStudentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyUserId = req.user!.userId;
      const studentId = req.params.id;
      const detail = await facultyService.getStudentDetail(facultyUserId, studentId);
      res.status(200).json({
        status: "success",
        data: detail,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const facultyController = new FacultyController();
