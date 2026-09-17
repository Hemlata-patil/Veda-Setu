import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { portfolioController } from "../controllers/portfolio.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5242880 }, // 5 MB
});

const router = Router();

// 1. Time-limited signed token streaming route (token verified inside controller/storage)
router.get(
  "/documents/stream",
  portfolioController.streamByToken.bind(portfolioController)
);

// 2. Student portfolio aggregated view
router.get(
  "/student",
  requireAuth,
  requireRole("student"),
  portfolioController.getStudentPortfolio.bind(portfolioController)
);

// 3. Portfolio items CRUD
router.get(
  "/items",
  requireAuth,
  requireRole("student"),
  portfolioController.listPortfolioItems.bind(portfolioController)
);

router.post(
  "/items",
  requireAuth,
  requireRole("student"),
  portfolioController.createPortfolioItem.bind(portfolioController)
);

router.patch(
  "/items/:id",
  requireAuth,
  requireRole("student"),
  portfolioController.updatePortfolioItem.bind(portfolioController)
);

router.put(
  "/items/:id",
  requireAuth,
  requireRole("student"),
  portfolioController.updatePortfolioItem.bind(portfolioController)
);

router.delete(
  "/items/:id",
  requireAuth,
  requireRole("student"),
  portfolioController.deletePortfolioItem.bind(portfolioController)
);

// 4. Portfolio document evidence upload, deletion & viewing
router.post(
  "/items/:itemId/documents",
  requireAuth,
  requireRole("student"),
  upload.single("file"),
  portfolioController.uploadPortfolioDocument.bind(portfolioController)
);

router.delete(
  "/documents/:documentId",
  requireAuth,
  requireRole("student"),
  portfolioController.deletePortfolioDocument.bind(portfolioController)
);

router.get(
  "/documents/:documentId/signed-url",
  requireAuth,
  requireRole("student"),
  portfolioController.getDocumentSignedUrl.bind(portfolioController)
);

router.get(
  "/documents/:documentId/view",
  requireAuth,
  requireRole("student"),
  portfolioController.viewDocument.bind(portfolioController)
);

export default router;
