export type PortfolioItemType =
  | "certification"
  | "project"
  | "achievement"
  | "research"
  | "publication"
  | "workshop"
  | "other";

export const VALID_ITEM_TYPES: PortfolioItemType[] = [
  "certification",
  "project",
  "achievement",
  "research",
  "publication",
  "workshop",
  "other",
];

export const MAX_DOCUMENT_FILE_SIZE = 5242880; // 5 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export interface PortfolioItemInput {
  item_type: PortfolioItemType;
  title: string;
  description?: string | null;
  issuer_or_organization?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  reference_url?: string | null;
  achievement?: string | null;
}

export interface PortfolioDocumentRecord {
  id: string;
  portfolio_item_id: string;
  student_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}
