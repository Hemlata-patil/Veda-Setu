import { Request, Response, NextFunction } from "express";
import { portfolioService } from "../services/portfolio.service";
import { storageService } from "../storage";
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
} from "../utils/validation";
import { AppError } from "../middleware/error.middleware";

export class PortfolioController {
  /**
   * GET /api/portfolio/student
   */
  async getStudentPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await portfolioService.getStudentPortfolio(req.user!.userId);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/portfolio/items
   */
  async listPortfolioItems(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await portfolioService.listPortfolioItems(req.user!.userId);
      res.status(200).json({
        status: "success",
        results: data.length,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/portfolio/items
   */
  async createPortfolioItem(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createPortfolioItemSchema.parse(req.body);
      const data = await portfolioService.createPortfolioItem(req.user!.userId, validated);
      res.status(201).json({
        status: "success",
        message: "Portfolio item created successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/portfolio/items/:id
   */
  async updatePortfolioItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updatePortfolioItemSchema.parse(req.body);
      const data = await portfolioService.updatePortfolioItem(req.user!.userId, id, validated);
      res.status(200).json({
        status: "success",
        message: "Portfolio item updated successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/portfolio/items/:id
   */
  async deletePortfolioItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await portfolioService.deletePortfolioItem(req.user!.userId, id);
      res.status(200).json({
        status: "success",
        message: "Portfolio item deleted successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/portfolio/items/:itemId/documents
   */
  async uploadPortfolioDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const file = req.file;

      if (!file) {
        throw new AppError("Please select a valid document file.", 400);
      }

      const data = await portfolioService.uploadPortfolioDocument(req.user!.userId, itemId, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      });

      res.status(201).json({
        status: "success",
        message: "Portfolio document uploaded successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/portfolio/documents/:documentId
   */
  async deletePortfolioDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      await portfolioService.deletePortfolioDocument(req.user!.userId, documentId);
      res.status(200).json({
        status: "success",
        message: "Portfolio document deleted successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/portfolio/documents/:documentId/signed-url
   */
  async getDocumentSignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const data = await portfolioService.getDocumentSignedUrl(req.user!.userId, documentId);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/portfolio/documents/:documentId/view
   * Direct authenticated streaming endpoint
   */
  async viewDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const { stream, contentType, contentLength, fileName } =
        await portfolioService.getDocumentStream(req.user!.userId, documentId);

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", contentLength);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/portfolio/documents/stream?token=...
   * Time-limited tokenized streaming endpoint
   */
  async streamByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      if (!token) {
        throw new AppError("Document view token is required.", 401);
      }

      if (!storageService.verifyToken) {
        throw new AppError("Storage provider does not support token streaming.", 500);
      }

      const { path: storagePath } = storageService.verifyToken(token);
      const { stream, contentType, contentLength } = await storageService.getFileStream(storagePath);

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", contentLength);
      res.setHeader("Content-Disposition", "inline");
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

export const portfolioController = new PortfolioController();
