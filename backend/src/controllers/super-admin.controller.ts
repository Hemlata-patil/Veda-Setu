import { Request, Response, NextFunction } from "express";
import { superAdminService } from "../services/super-admin.service";

export class SuperAdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await superAdminService.getDashboard();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async getInstitutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await superAdminService.getInstitutions();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async createInstitutionWithAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await superAdminService.createInstitutionWithAdmin(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateInstitutionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await superAdminService.updateInstitutionStatus(id, status);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await superAdminService.getOrganizations();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async createIndustryWithAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await superAdminService.createIndustryWithAdmin(req.body);
      res.status(201).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateOrganizationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await superAdminService.updateOrganizationStatus(id, status);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await superAdminService.getUsers();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      // Authoritative caller ID strictly from JWT
      const callerUserId = req.user!.userId;
      const result = await superAdminService.updateUserRole(id, role, callerUserId);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await superAdminService.getOpportunities();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  async moderateOpportunityStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await superAdminService.moderateOpportunityStatus(id, status);
      res.status(200).json({ status: "success", data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await superAdminService.getAnalytics();
      res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }
}

export const superAdminController = new SuperAdminController();
