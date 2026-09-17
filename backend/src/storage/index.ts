import { LocalStorageService } from "./local-storage.service";
import { IStorageService } from "./storage.interface";

export * from "./storage.interface";
export * from "./local-storage.service";

// Default storage singleton (Local storage provider, swappable for S3 or Cloudinary)
export const storageService: IStorageService & { verifyToken?: (token: string) => { path: string } } = new LocalStorageService();
