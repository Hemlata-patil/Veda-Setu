"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  uploadPortfolioDocument,
  deletePortfolioDocument,
  getPortfolioDocumentSignedUrl,
} from "./actions";
import {
  PortfolioDocumentRecord,
  MAX_DOCUMENT_FILE_SIZE,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "./types";
import {
  FileText,
  FileCheck,
  Image as ImageIcon,
  Paperclip,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface PortfolioDocumentAttachmentProps {
  portfolioItemId: string;
  document?: PortfolioDocumentRecord | null;
  onDocumentChange: () => void;
}

export function PortfolioDocumentAttachment({
  portfolioItemId,
  document,
  onDocumentChange,
}: PortfolioDocumentAttachmentProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isViewing, setIsViewing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // 1. Client-side file size validation: max 5 MB
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      setErrorMessage("File size must be 5 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Client-side MIME type validation
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) {
      setErrorMessage("Only PDF, JPG, and PNG files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("portfolio_item_id", portfolioItemId);
    formData.append("file", file);

    const res = await uploadPortfolioDocument(formData);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (res.success) {
      onDocumentChange();
    } else {
      setErrorMessage(res.error || "Failed to upload document.");
    }
  };

  const handleView = async () => {
    if (!document) return;
    setErrorMessage(null);
    setIsViewing(true);
    const res = await getPortfolioDocumentSignedUrl(document.id);
    setIsViewing(false);

    if (res.success && res.signedUrl) {
      window.open(res.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setErrorMessage(res.error || "Failed to view document.");
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    if (!confirm("Are you sure you want to delete this attached document?")) {
      return;
    }
    setErrorMessage(null);
    setIsDeleting(true);
    const res = await deletePortfolioDocument(document.id);
    setIsDeleting(false);

    if (res.success) {
      onDocumentChange();
    } else {
      setErrorMessage(res.error || "Failed to delete document.");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-ayush-border/50 space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileSelect}
      />

      {errorMessage && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {document ? (
        // Attached document display
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-ayush-sand/30 border border-ayush-border/60">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-white border border-ayush-border/60 text-ayush-green shrink-0">
              {document.file_type === "application/pdf" ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-ayush-dark">
                  {document.file_name}
                </span>
                <Badge variant="herbal" className="text-[9px] py-0 px-1.5 shrink-0">
                  {document.file_type === "application/pdf" ? "PDF" : "IMAGE"}
                </Badge>
              </div>
              <span className="text-[11px] text-ayush-muted block">
                {formatFileSize(Number(document.file_size))}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View action */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleView}
              disabled={isViewing || isDeleting || isUploading}
              className="h-7 px-2 text-xs gap-1"
              title="View Document"
            >
              {isViewing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ExternalLink className="w-3 h-3" />
              )}
              <span>View</span>
            </Button>

            {/* Replace action */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isViewing || isDeleting || isUploading}
              className="h-7 px-2 text-xs gap-1 text-ayush-muted hover:text-ayush-dark"
              title="Replace Document"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>Replace</span>
            </Button>

            {/* Delete action */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isViewing || isDeleting || isUploading}
              className="h-7 px-2 text-xs text-ayush-muted hover:text-red-600 hover:bg-red-50"
              title="Delete Document"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        // No document attached state
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-ayush-sand/20 border border-dashed border-ayush-border/70">
          <div className="text-[11px] text-ayush-muted">
            <span className="font-medium text-ayush-dark">Maximum file size: 5 MB</span>
            <span className="mx-1">•</span>
            <span>Allowed: PDF, JPG, PNG</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-7 px-2.5 text-xs gap-1.5 border-ayush-border self-start sm:self-auto hover:bg-ayush-sand/50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-ayush-green" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Paperclip className="w-3 h-3 text-ayush-muted" />
                <span>Add Document</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
