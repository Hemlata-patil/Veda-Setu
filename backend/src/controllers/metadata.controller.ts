import { Request, Response, NextFunction } from "express";
import { metadataService } from "../services/metadata.service";

export class MetadataController {
  async getInstitutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutions = await metadataService.getInstitutions();
      res.status(200).json({
        status: "success",
        results: institutions.length,
        data: { institutions },
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizations = await metadataService.getOrganizations();
      res.status(200).json({
        status: "success",
        results: organizations.length,
        data: { organizations },
      });
    } catch (err) {
      next(err);
    }
  }

  async getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const skills = await metadataService.getSkills(category);
      res.status(200).json({
        status: "success",
        results: skills.length,
        data: { skills },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCompetencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const competencies = await metadataService.getCompetencies(category);
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

export const metadataController = new MetadataController();
