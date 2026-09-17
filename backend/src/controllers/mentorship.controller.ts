import { Request, Response, NextFunction } from "express";
import { mentorshipService } from "../services/mentorship.service";
import {
  requestMentorshipSchema,
  initiateMentorshipSchema,
  updateMentorNoteSchema,
} from "../utils/validation";

export class MentorshipController {
  // Student workflows
  async getStudentDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await mentorshipService.getStudentDashboard(req.user!.userId);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async requestMentorship(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = requestMentorshipSchema.parse(req.body);
      const data = await mentorshipService.requestMentorship(req.user!.userId, validated);
      res.status(201).json({
        status: "success",
        message: "Mentorship request submitted successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Faculty workflows
  async getFacultyDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await mentorshipService.getFacultyDashboard(req.user!.userId);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await mentorshipService.acceptRequest(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        message: "Mentorship request accepted.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await mentorshipService.rejectRequest(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        message: "Mentorship request rejected.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async initiateMentorship(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = initiateMentorshipSchema.parse(req.body);
      const data = await mentorshipService.initiateMentorship(req.user!.userId, validated);
      res.status(201).json({
        status: "success",
        message: "Mentorship initiated successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMentorNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateMentorNoteSchema.parse(req.body);
      const data = await mentorshipService.updateMentorNote(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: "Mentor note updated.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async completeMentorship(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await mentorshipService.completeMentorship(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        message: "Mentorship marked as completed.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mentorshipController = new MentorshipController();
