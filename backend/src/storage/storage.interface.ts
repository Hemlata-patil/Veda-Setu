import { Readable } from "stream";

export interface FileStreamResult {
  stream: Readable;
  contentType: string;
  contentLength: number;
}

export interface IStorageService {
  /**
   * Upload file bytes to the underlying storage provider
   */
  upload(storagePath: string, fileBuffer: Buffer, contentType: string): Promise<void>;

  /**
   * Delete a stored file from the storage provider
   */
  delete(storagePath: string): Promise<void>;

  /**
   * Generate a time-limited signed URL or tokenized URL for authenticated viewing
   */
  getSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string>;

  /**
   * Retrieve a readable stream of the file content for private transmission
   */
  getFileStream(storagePath: string): Promise<FileStreamResult>;
}
