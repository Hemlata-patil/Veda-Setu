import { Request, Response, NextFunction } from "express";
import { facultyCollaborationService } from "../services/collaboration.service";
import {
  createFacultyOpportunitySchema,
  updateFacultyOpportunitySchema,
  updateFacultyOpportunityStatusSchema,
  expressFacultyInterestSchema,
  updateFacultyInterestMessageSchema,
  updateFacultyInterestStatusSchema,
} from "../utils/validation";

export class FacultyCollaborationController {
  // Opportunity discovery & detail
  async listOpportunities(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, mode } = req.query;
      const data = await facultyCollaborationService.listOpportunities(req.user!.userId, {
        opportunityType: type as string | undefined,
        mode: mode as string | undefined,
      });
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOpportunityDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await facultyCollaborationService.getOpportunityDetail(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Author workflows
  async listMyAuthoredOpportunities(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await facultyCollaborationService.listMyAuthoredOpportunities(req.user!.userId);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async createOpportunity(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createFacultyOpportunitySchema.parse(req.body);
      const data = await facultyCollaborationService.createOpportunity(req.user!.userId, validated);
      res.status(201).json({
        status: "success",
        message: "Opportunity created successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOpportunityMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateFacultyOpportunitySchema.parse(req.body);
      const data = await facultyCollaborationService.updateOpportunityMetadata(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: "Opportunity metadata updated.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOpportunityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateFacultyOpportunityStatusSchema.parse(req.body);
      const data = await facultyCollaborationService.updateOpportunityStatus(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: `Opportunity status updated to ${validated.status}.`,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Interests workflows
  async listMyInterests(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await facultyCollaborationService.listMyInterests(req.user!.userId);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async expressInterest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = expressFacultyInterestSchema.parse(req.body);
      const data = await facultyCollaborationService.expressInterest(req.user!.userId, id, validated);
      res.status(201).json({
        status: "success",
        message: "Statement of interest submitted successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateInterestMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateFacultyInterestMessageSchema.parse(req.body);
      const data = await facultyCollaborationService.updateInterestMessage(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: "Statement message updated.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async withdrawInterest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await facultyCollaborationService.withdrawInterest(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        message: "Statement of interest has been withdrawn.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async listOpportunityApplicants(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await facultyCollaborationService.listOpportunityApplicants(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateApplicantStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateFacultyInterestStatusSchema.parse(req.body);
      const data = await facultyCollaborationService.updateApplicantStatus(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: `Applicant review status updated to ${validated.status}.`,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const facultyCollaborationController = new FacultyCollaborationController();
