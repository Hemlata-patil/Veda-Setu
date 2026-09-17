import { Request, Response, NextFunction } from "express";
import { opportunityService } from "../services/opportunity.service";
import { AppError } from "../middleware/error.middleware";

export class OpportunityController {
  /**
   * GET /api/opportunities
   * Student: List published opportunities with skill match calculation
   */
  async getPublishedOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = req.user!.userId;
      const opportunities = await opportunityService.getPublishedOpportunitiesForStudent(studentUserId);
      res.status(200).json({
        status: "success",
        results: opportunities.length,
        data: { opportunities },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/opportunities/:id
   * Student: Get published opportunity details
   */
  async getOpportunityDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const studentUserId = req.user!.userId;
      const opportunity = await opportunityService.getPublishedOpportunityDetail(id, studentUserId);
      res.status(200).json({
        status: "success",
        data: { opportunity },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/industry/opportunities
   * Industry: List opportunities created by the authenticated industry partner
   */
  async getIndustryOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const industryUserId = req.user!.userId;
      const opportunities = await opportunityService.getIndustryOpportunities(industryUserId);
      res.status(200).json({
        status: "success",
        results: opportunities.length,
        data: { opportunities },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/industry/opportunities/:id
   * Industry: Get opportunity details
   */
  async getIndustryOpportunityDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const industryUserId = req.user!.userId;
      const opportunity = await opportunityService.getIndustryOpportunityDetail(id, industryUserId);
      res.status(200).json({
        status: "success",
        data: { opportunity },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/industry/opportunities
   * Industry: Create opportunity with competencies (atomic transaction)
   */
  async createOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const industryUserId = req.user!.userId;
      const result = await opportunityService.createOpportunity(industryUserId, req.body);
      res.status(201).json({
        status: "success",
        message: "Opportunity created successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/industry/opportunities/:id
   * Industry: Update opportunity and competencies (atomic transaction)
   */
  async updateOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const industryUserId = req.user!.userId;
      await opportunityService.updateOpportunity(id, industryUserId, req.body);
      res.status(200).json({
        status: "success",
        message: "Opportunity updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/industry/opportunities/:id/status
   * Industry: Update opportunity status
   */
  async updateOpportunityStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const industryUserId = req.user!.userId;
      const { status } = req.body;
      await opportunityService.updateOpportunityStatus(id, industryUserId, status);
      res.status(200).json({
        status: "success",
        message: `Opportunity status transitioned to '${status}' successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/industry/opportunities/:id
   * Industry: Delete opportunity
   */
  async deleteOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const industryUserId = req.user!.userId;
      await opportunityService.deleteOpportunity(id, industryUserId);
      res.status(200).json({
        status: "success",
        message: "Opportunity deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

export const opportunityController = new OpportunityController();
