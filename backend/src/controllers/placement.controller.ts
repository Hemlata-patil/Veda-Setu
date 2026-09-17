import { Request, Response, NextFunction } from "express";
import { placementService } from "../services/placement.service";
import {
  createPlacementTrackingSchema,
  updatePlacementTrackingSchema,
} from "../utils/validation";

export class PlacementController {
  async createPlacementTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createPlacementTrackingSchema.parse(req.body);
      const data = await placementService.createPlacementTracking(req.user!.userId, validated);
      res.status(201).json({
        status: "success",
        message: "Internship/placement tracking initiated successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePlacementTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updatePlacementTrackingSchema.parse(req.body);
      const data = await placementService.updatePlacementTracking(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: "Placement tracking updated successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentPlacements(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await placementService.getStudentPlacements(req.user!.userId);
      res.status(200).json({
        status: "success",
        results: data.length,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getIndustryPlacements(req: Request, res: Response, next: NextFunction) {
    try {
      const includeUnplaced = req.query.includeUnplaced === "true";
      const data = await placementService.getIndustryPlacements(req.user!.userId, includeUnplaced);
      res.status(200).json({
        status: "success",
        results: data.length,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getInstitutionPlacements(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await placementService.getInstitutionPlacements(req.user!.userId);
      res.status(200).json({
        status: "success",
        results: data.length,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPlacementById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await placementService.getPlacementById(req.user!.userId, req.user!.role, id);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const placementController = new PlacementController();
