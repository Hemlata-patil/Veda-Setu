import { Request, Response, NextFunction } from "express";
import { institutionService } from "../services/institution.service";

export class InstitutionController {
  /**
   * GET /api/institution/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const dashboard = await institutionService.getDashboard(institutionUserId);
      res.status(200).json({
        status: "success",
        data: dashboard,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/institution/faculty
   */
  async getFacultyDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const faculty = await institutionService.getFacultyDirectory(institutionUserId);
      res.status(200).json({
        status: "success",
        results: faculty.length,
        data: { faculty },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/institution/faculty
   * Atomic faculty provisioning
   */
  async provisionFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const result = await institutionService.provisionFaculty(institutionUserId, req.body);
      res.status(201).json({
        status: "success",
        message: "Faculty account provisioned successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/institution/students
   */
  async getStudentDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const students = await institutionService.getStudentDirectory(institutionUserId);
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
   * GET /api/institution/students/:id
   */
  async getStudentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const studentId = req.params.id;
      const detail = await institutionService.getStudentDetail(institutionUserId, studentId);
      res.status(200).json({
        status: "success",
        data: detail,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/institution/analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const analytics = await institutionService.getAnalytics(institutionUserId);
      res.status(200).json({
        status: "success",
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/institution/internship-placement
   */
  async getInternshipPlacements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutionUserId = req.user!.userId;
      const result = await institutionService.getInternshipPlacements(institutionUserId);
      res.status(200).json({
        status: "success",
        results: result.placements.length,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const institutionController = new InstitutionController();
