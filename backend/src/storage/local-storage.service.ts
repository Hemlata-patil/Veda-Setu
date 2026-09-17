import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { IStorageService, FileStreamResult } from "./storage.interface";
import { AppError } from "../middleware/error.middleware";

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), "uploads", "portfolio-documents");
  }

  /**
   * Resolve and sanitize target filepath to prevent path traversal attacks
   */
  private resolvePath(storagePath: string): string {
    const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(this.baseDir, normalized);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new AppError("Invalid storage path: directory traversal attempt.", 400);
    }
    return fullPath;
  }

  async upload(storagePath: string, fileBuffer: Buffer, _contentType: string): Promise<void> {
    const fullPath = this.resolvePath(storagePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, fileBuffer);
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = this.resolvePath(storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (err: any) {
      // Ignore if file already deleted or doesn't exist
      if (err.code !== "ENOENT") {
        console.error(`Failed to delete storage file at ${fullPath}:`, err);
      }
    }
  }

  async getSignedUrl(storagePath: string, expiresInSeconds: number = 60): Promise<string> {
    // Generate secure HMAC signature token for time-limited viewing
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const payload = `${storagePath}:${expiresAt}`;
    const hmac = crypto.createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
    const token = Buffer.from(JSON.stringify({ path: storagePath, exp: expiresAt, sig: hmac })).toString("base64url");

    return `/api/portfolio/documents/stream?token=${token}`;
  }

  async getFileStream(storagePath: string): Promise<FileStreamResult> {
    const fullPath = this.resolvePath(storagePath);
    try {
      const stats = await fs.stat(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";

      const stream = createReadStream(fullPath);
      return {
        stream,
        contentType,
        contentLength: stats.size,
      };
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new AppError("Stored document file not found.", 404);
      }
      throw err;
    }
  }

  /**
   * Verify time-limited HMAC token for streaming
   */
  verifyToken(token: string): { path: string } {
    try {
      const json = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
      const { path: storagePath, exp, sig } = json;
      if (!storagePath || !exp || !sig) {
        throw new AppError("Invalid document view token.", 401);
      }
      if (Date.now() > exp) {
        throw new AppError("Document view token has expired.", 401);
      }
      const payload = `${storagePath}:${exp}`;
      const expectedHmac = crypto.createHmac("sha256", env.JWT_SECRET).update(payload).digest("hex");
      if (sig !== expectedHmac) {
        throw new AppError("Document view token signature verification failed.", 401);
      }
      return { path: storagePath };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError("Malformed document view token.", 400);
    }
  }
}
