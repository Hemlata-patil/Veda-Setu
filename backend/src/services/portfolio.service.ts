import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import { IStorageService, storageService } from "../storage";
import {
  CreatePortfolioItemInput,
  UpdatePortfolioItemInput,
} from "../utils/validation";
import crypto from "crypto";

export const MAX_DOCUMENT_FILE_SIZE = 5242880; // 5 MB
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export class PortfolioService {
  private storage: IStorageService;

  constructor(customStorage?: IStorageService) {
    this.storage = customStorage || storageService;
  }

  /**
   * Aggregate complete student digital portfolio with items, documents, and placements.
   */
  async getStudentPortfolio(studentUserId: string) {
    // 1. Fetch student profile and institution
    const profRes = await db.query(
      `SELECT p.id, p.full_name, u.email, u.role, p.program, p.year, p.department,
              inst.name AS institution_name, inst.code AS institution_code
       FROM public.profiles p
       JOIN public.users u ON p.id = u.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE p.id = $1`,
      [studentUserId]
    );

    const profile = profRes.rows[0] || null;

    // 2. Fetch standardized competencies
    const compRes = await db.query(
      `SELECT sc.competency_id, sc.proficiency_score, sc.verified,
              c.name, c.category
       FROM public.student_competencies sc
       JOIN public.competencies c ON sc.competency_id = c.id
       WHERE sc.student_id = $1
       ORDER BY c.category, c.name`,
      [studentUserId]
    );

    // 3. Fetch portfolio items
    const itemsRes = await db.query(
      `SELECT * FROM public.portfolio_items
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [studentUserId]
    );

    // 4. Fetch portfolio documents
    const docsRes = await db.query(
      `SELECT id, portfolio_item_id, student_id, storage_path, file_name, file_type, file_size, created_at
       FROM public.portfolio_documents
       WHERE student_id = $1`,
      [studentUserId]
    );

    // 5. Fetch student's placement records
    const placementsRes = await db.query(
      `SELECT p.id, p.engagement_type, p.status, p.start_date, p.expected_end_date,
              p.actual_end_date, p.progress_percent, p.supervisor_name, p.outcome,
              o.title AS opportunity_title, org.name AS organization_name
       FROM public.internship_placements p
       JOIN public.applications a ON p.application_id = a.id
       JOIN public.opportunities o ON a.opportunity_id = o.id
       LEFT JOIN public.organizations org ON o.organization_id = org.id
       WHERE a.student_id = $1
       ORDER BY p.created_at DESC`,
      [studentUserId]
    );

    return {
      profile,
      competencies: compRes.rows.map((c: any) => ({
        id: c.competency_id,
        name: c.name,
        category: c.category,
        score: Math.round(Number(c.proficiency_score) || 0),
        verified: Boolean(c.verified),
      })),
      items: itemsRes.rows,
      documents: docsRes.rows,
      placements: placementsRes.rows,
    };
  }

  /**
   * List portfolio items with their attached documents for the student.
   */
  async listPortfolioItems(studentUserId: string) {
    const itemsRes = await db.query(
      `SELECT * FROM public.portfolio_items
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [studentUserId]
    );

    const docsRes = await db.query(
      `SELECT id, portfolio_item_id, student_id, storage_path, file_name, file_type, file_size, created_at
       FROM public.portfolio_documents
       WHERE student_id = $1`,
      [studentUserId]
    );

    const docsMap = new Map<string, any>();
    docsRes.rows.forEach((doc: any) => docsMap.set(doc.portfolio_item_id, doc));

    return itemsRes.rows.map((item: any) => ({
      ...item,
      document: docsMap.get(item.id) || null,
    }));
  }

  /**
   * Create a new portfolio item.
   */
  async createPortfolioItem(studentUserId: string, input: CreatePortfolioItemInput) {
    if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
      throw new AppError("End date cannot be earlier than start date.", 400);
    }

    const res = await db.query(
      `INSERT INTO public.portfolio_items (
         student_id,
         item_type,
         title,
         description,
         issuer_or_organization,
         start_date,
         end_date,
         reference_url,
         achievement
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        studentUserId,
        input.itemType,
        input.title.trim(),
        input.description?.trim() || null,
        input.issuerOrOrganization?.trim() || null,
        input.startDate || null,
        input.endDate || null,
        input.referenceUrl?.trim() || null,
        input.achievement?.trim() || null,
      ]
    );

    return res.rows[0];
  }

  /**
   * Update an existing portfolio item (student owner only).
   */
  async updatePortfolioItem(
    studentUserId: string,
    itemId: string,
    input: UpdatePortfolioItemInput
  ) {
    // 1. Verify existence and ownership
    const checkRes = await db.query(
      `SELECT id, student_id, start_date, end_date FROM public.portfolio_items WHERE id = $1`,
      [itemId]
    );

    if (checkRes.rows.length === 0) {
      throw new AppError("Portfolio item not found.", 404);
    }

    if (checkRes.rows[0].student_id !== studentUserId) {
      throw new AppError("Unauthorized: You do not own this portfolio item.", 403);
    }

    const current = checkRes.rows[0];
    const finalStartDate = input.startDate !== undefined ? input.startDate : current.start_date;
    const finalEndDate = input.endDate !== undefined ? input.endDate : current.end_date;

    if (finalStartDate && finalEndDate && new Date(finalEndDate) < new Date(finalStartDate)) {
      throw new AppError("End date cannot be earlier than start date.", 400);
    }

    const res = await db.query(
      `UPDATE public.portfolio_items
       SET item_type = COALESCE($1, item_type),
           title = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE title END,
           description = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE description END,
           issuer_or_organization = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE issuer_or_organization END,
           start_date = CASE WHEN $5::text IS NOT NULL THEN $5::date ELSE start_date END,
           end_date = CASE WHEN $6::text IS NOT NULL THEN $6::date ELSE end_date END,
           reference_url = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE reference_url END,
           achievement = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE achievement END,
           updated_at = NOW()
       WHERE id = $9 AND student_id = $10
       RETURNING *`,
      [
        input.itemType || null,
        input.title !== undefined ? input.title.trim() : null,
        input.description !== undefined ? input.description?.trim() || null : null,
        input.issuerOrOrganization !== undefined ? input.issuerOrOrganization?.trim() || null : null,
        input.startDate !== undefined ? input.startDate : null,
        input.endDate !== undefined ? input.endDate : null,
        input.referenceUrl !== undefined ? input.referenceUrl?.trim() || null : null,
        input.achievement !== undefined ? input.achievement?.trim() || null : null,
        itemId,
        studentUserId,
      ]
    );

    return res.rows[0];
  }

  /**
   * Delete a portfolio item and clean up any attached storage documents.
   */
  async deletePortfolioItem(studentUserId: string, itemId: string) {
    // 1. Fetch item and attached documents ensuring student ownership
    const itemRes = await db.query(
      `SELECT id, student_id FROM public.portfolio_items WHERE id = $1`,
      [itemId]
    );

    if (itemRes.rows.length === 0) {
      throw new AppError("Portfolio item not found.", 404);
    }

    if (itemRes.rows[0].student_id !== studentUserId) {
      throw new AppError("Unauthorized: You do not own this portfolio item.", 403);
    }

    const docsRes = await db.query(
      `SELECT id, storage_path FROM public.portfolio_documents
       WHERE portfolio_item_id = $1 AND student_id = $2`,
      [itemId, studentUserId]
    );

    // 2. Clean up storage files
    for (const doc of docsRes.rows) {
      try {
        await this.storage.delete(doc.storage_path);
      } catch (storageErr) {
        console.error(`Failed to delete storage file ${doc.storage_path}:`, storageErr);
      }
    }

    // 3. Delete portfolio item (ON DELETE CASCADE handles portfolio_documents rows in DB)
    await db.query(
      `DELETE FROM public.portfolio_items WHERE id = $1 AND student_id = $2`,
      [itemId, studentUserId]
    );

    return { success: true };
  }

  /**
   * Upload an evidence document attachment for a portfolio item with atomic replacement.
   */
  async uploadPortfolioDocument(
    studentUserId: string,
    portfolioItemId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ) {
    if (!file || !file.buffer || file.size === 0) {
      throw new AppError("Please select a valid document file.", 400);
    }

    // 1. Validate file size (max 5 MB)
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      throw new AppError("File size must be 5 MB or smaller.", 413);
    }

    // 2. Validate MIME type
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError("Only PDF, JPG, and PNG files are allowed.", 400);
    }

    // 3. Verify portfolio item exists and belongs to student
    const itemRes = await db.query(
      `SELECT id, student_id FROM public.portfolio_items WHERE id = $1`,
      [portfolioItemId]
    );

    if (itemRes.rows.length === 0) {
      throw new AppError("Portfolio item not found.", 404);
    }

    if (itemRes.rows[0].student_id !== studentUserId) {
      throw new AppError("Unauthorized: You do not own this portfolio item.", 403);
    }

    // 4. Fetch existing documents for replacement cleanup
    const existingDocsRes = await db.query(
      `SELECT id, storage_path FROM public.portfolio_documents
       WHERE portfolio_item_id = $1 AND student_id = $2`,
      [portfolioItemId, studentUserId]
    );

    // 5. Generate secure storage path: <student_id>/<portfolio_item_id>/<uniquePrefix>-<sanitizedFileName>
    const sanitizedBaseName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const storagePath = `${studentUserId}/${portfolioItemId}/${uniquePrefix}-${sanitizedBaseName}`;

    // 6. Upload file buffer to storage abstraction
    await this.storage.upload(storagePath, file.buffer, file.mimetype);

    // 7. Insert metadata record in DB
    let newDocRow: any;
    try {
      const insertRes = await db.query(
        `INSERT INTO public.portfolio_documents (
           portfolio_item_id,
           student_id,
           storage_path,
           file_name,
           file_type,
           file_size
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          portfolioItemId,
          studentUserId,
          storagePath,
          file.originalname,
          file.mimetype,
          file.size,
        ]
      );
      newDocRow = insertRes.rows[0];
    } catch (insertErr) {
      // Storage consistency: clean up newly written file to avoid orphaned file
      try {
        await this.storage.delete(storagePath);
      } catch (cleanErr) {
        console.error("Failed to clean up storage after DB insert failure:", cleanErr);
      }
      throw insertErr;
    }

    // 8. Clean up previously attached document(s) if replacing
    if (existingDocsRes.rows.length > 0) {
      const oldPaths = existingDocsRes.rows.map((d: any) => d.storage_path);
      const oldIds = existingDocsRes.rows.map((d: any) => d.id);

      for (const oldPath of oldPaths) {
        try {
          await this.storage.delete(oldPath);
        } catch (err) {
          console.error(`Failed to remove old storage file ${oldPath}:`, err);
        }
      }

      await db.query(
        `DELETE FROM public.portfolio_documents WHERE id = ANY($1::uuid[]) AND student_id = $2`,
        [oldIds, studentUserId]
      );
    }

    return newDocRow;
  }

  /**
   * Delete an attached portfolio document and its storage file.
   */
  async deletePortfolioDocument(studentUserId: string, documentId: string) {
    const docRes = await db.query(
      `SELECT id, storage_path, student_id FROM public.portfolio_documents WHERE id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new AppError("Document not found.", 404);
    }

    if (docRes.rows[0].student_id !== studentUserId) {
      throw new AppError("Unauthorized: You do not own this document.", 403);
    }

    const doc = docRes.rows[0];

    // 1. Remove storage file
    await this.storage.delete(doc.storage_path);

    // 2. Delete database row
    await db.query(
      `DELETE FROM public.portfolio_documents WHERE id = $1 AND student_id = $2`,
      [documentId, studentUserId]
    );

    return { success: true };
  }

  /**
   * Generate secure signed URL for viewing document.
   */
  async getDocumentSignedUrl(studentUserId: string, documentId: string) {
    const docRes = await db.query(
      `SELECT id, storage_path, file_name, student_id FROM public.portfolio_documents WHERE id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new AppError("Document not found.", 404);
    }

    if (docRes.rows[0].student_id !== studentUserId) {
      throw new AppError("Unauthorized: You do not own this document.", 403);
    }

    const doc = docRes.rows[0];
    const signedUrl = await this.storage.getSignedUrl(doc.storage_path, 60);

    return {
      signedUrl,
      fileName: doc.file_name,
    };
  }

  /**
   * Retrieve file stream for authenticated streaming.
   */
  async getDocumentStream(studentUserId: string, documentId: string) {
    const docRes = await db.query(
      `SELECT id, storage_path, file_name, file_type, student_id FROM public.portfolio_documents WHERE id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new AppError("Document not found.", 404);
    }

    if (docRes.rows[0].student_id !== studentUserId) {
      throw new AppError("Unauthorized: You do not own this document.", 403);
    }

    const doc = docRes.rows[0];
    const streamResult = await this.storage.getFileStream(doc.storage_path);

    return {
      ...streamResult,
      fileName: doc.file_name,
    };
  }
}

export const portfolioService = new PortfolioService();
