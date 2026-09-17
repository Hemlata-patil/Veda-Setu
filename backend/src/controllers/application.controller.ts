import { Request, Response, NextFunction } from "express";
import { applicationService } from "../services/application.service";
import { AppError } from "../middleware/error.middleware";

export class ApplicationController {
  /**
   * POST /api/opportunities/:id/applications
   * Student: Apply to a published opportunity
   */
  async applyToOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const opportunityId = req.params.id;
      const studentUserId = req.user!.userId;
      const { coverNote } = req.body;

      const result = await applicationService.submitApplication(
        studentUserId,
        opportunityId,
        coverNote
      );

      res.status(201).json({
        status: "success",
        message: "Application submitted successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/students/me/applications
   * Student: List own submitted applications
   */
  async getStudentApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = req.user!.userId;
      const applications = await applicationService.getStudentApplications(studentUserId);
      res.status(200).json({
        status: "success",
        results: applications.length,
        data: { applications },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/applications/:id/withdraw
   * Student: Withdraw application
   */
  async withdrawApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicationId = req.params.id;
      const studentUserId = req.user!.userId;
      await applicationService.withdrawApplication(studentUserId, applicationId);
      res.status(200).json({
        status: "success",
        message: "Application withdrawn successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/applications/:id/cover-note
   * Student: Update cover note while in 'applied' status
   */
  async updateCoverNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicationId = req.params.id;
      const studentUserId = req.user!.userId;
      const { coverNote } = req.body;
      if (typeof coverNote !== "string") {
        throw new AppError("coverNote string is required", 400);
      }
      await applicationService.updateCoverNote(studentUserId, applicationId, coverNote);
      res.status(200).json({
        status: "success",
        message: "Cover note updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/industry/applications
   * Industry: List all candidates across all opportunities created by the authenticated industry partner
   */
  async getIndustryApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const industryUserId = req.user!.userId;
      const applications = await applicationService.getAllApplicantsForIndustry(industryUserId);
      res.status(200).json({
        status: "success",
        results: applications.length,
        data: { applications },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/industry/opportunities/:id/applications
   * Industry: List candidates for an opportunity
   */
  async getOpportunityApplicants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const opportunityId = req.params.id;
      const industryUserId = req.user!.userId;
      const applicants = await applicationService.getApplicantsForOpportunity(
        opportunityId,
        industryUserId
      );
      res.status(200).json({
        status: "success",
        results: applicants.length,
        data: { applicants },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/industry/applications/:id
   * Industry: Get single candidate review detail
   */
  async getCandidateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicationId = req.params.id;
      const industryUserId = req.user!.userId;
      const candidate = await applicationService.getCandidateReviewDetail(
        applicationId,
        industryUserId
      );
      res.status(200).json({
        status: "success",
        data: { candidate },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/industry/applications/:id/status
   * Industry: Update candidate status (state machine)
   */
  async updateCandidateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const applicationId = req.params.id;
      const industryUserId = req.user!.userId;
      const { status } = req.body;
      const result = await applicationService.updateCandidateStatus(
        applicationId,
        industryUserId,
        status
      );
      res.status(200).json({
        status: "success",
        message: `Candidate status updated to '${result.status}' successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();
