"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createPortfolioItem,
  updatePortfolioItem,
  uploadPortfolioDocument,
} from "./actions";
import {
  PortfolioItemType,
  PortfolioItemInput,
  PortfolioDocumentRecord,
  MAX_DOCUMENT_FILE_SIZE,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "./types";
import {
  Award,
  Loader2,
  Sparkles,
  FileText,
  FileCheck,
  Paperclip,
  Upload,
} from "lucide-react";

export interface PortfolioItemRecord {
  id: string;
  student_id: string;
  item_type: PortfolioItemType;
  title: string;
  description: string | null;
  issuer_or_organization: string | null;
  start_date: string | null;
  end_date: string | null;
  reference_url: string | null;
  achievement: string | null;
  created_at: string;
  updated_at: string;
}

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: PortfolioItemType;
  itemToEdit?: PortfolioItemRecord | null;
  existingDocument?: PortfolioDocumentRecord | null;
  onSuccess: () => void;
}

const ITEM_TYPES: { value: PortfolioItemType; label: string; description: string }[] = [
  { value: "certification", label: "Certification", description: "Official credential, diploma or exam certificate" },
  { value: "project", label: "Project", description: "Clinical trial, botanical study, software or formulation project" },
  { value: "research", label: "Research", description: "Formal research study, laboratory thesis or clinical investigation" },
  { value: "publication", label: "Publication", description: "Journal article, paper, book chapter or conference paper" },
  { value: "achievement", label: "Achievement", description: "Award, honor, scholarship or hackathon prize" },
  { value: "workshop", label: "Workshop", description: "Hands-on clinical training, CME, seminar or boot camp" },
  { value: "other", label: "Other Evidence", description: "Community outreach, extracurricular or professional milestone" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PortfolioModal({
  isOpen,
  onClose,
  defaultType = "certification",
  itemToEdit,
  existingDocument,
  onSuccess,
}: PortfolioModalProps) {
  const isEditing = Boolean(itemToEdit);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [itemType, setItemType] = React.useState<PortfolioItemType>(defaultType);
  const [title, setTitle] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [referenceUrl, setReferenceUrl] = React.useState("");
  const [achievement, setAchievement] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync form when itemToEdit changes or modal opens
  React.useEffect(() => {
    if (itemToEdit) {
      setItemType(itemToEdit.item_type);
      setTitle(itemToEdit.title || "");
      setIssuer(itemToEdit.issuer_or_organization || "");
      setStartDate(itemToEdit.start_date || "");
      setEndDate(itemToEdit.end_date || "");
      setReferenceUrl(itemToEdit.reference_url || "");
      setAchievement(itemToEdit.achievement || "");
      setDescription(itemToEdit.description || "");
    } else {
      setItemType(defaultType);
      setTitle("");
      setIssuer("");
      setStartDate("");
      setEndDate("");
      setReferenceUrl("");
      setAchievement("");
      setDescription("");
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  }, [itemToEdit, defaultType, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = files[0];

    // 1. Client-side file size validation (<= 5 MB)
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      setError("File size must be 5 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    // 2. Client-side MIME type validation
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a title for this portfolio entry.");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setIsSubmitting(true);

    const payload: PortfolioItemInput = {
      item_type: itemType,
      title: title.trim(),
      issuer_or_organization: issuer.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      reference_url: referenceUrl.trim() || null,
      achievement: achievement.trim() || null,
      description: description.trim() || null,
    };

    // Step 1: Create or update portfolio_items record first
    const res = isEditing && itemToEdit
      ? await updatePortfolioItem(itemToEdit.id, payload)
      : await createPortfolioItem(payload);

    if (!res.success || !res.data) {
      setIsSubmitting(false);
      setError(res.error || "Failed to save portfolio item.");
      return;
    }

    const savedItemId = res.data.id;

    // Step 2: Upload selected document if user attached one
    if (selectedFile) {
      const formData = new FormData();
      formData.append("portfolio_item_id", savedItemId);
      formData.append("file", selectedFile);

      const uploadRes = await uploadPortfolioDocument(formData);
      setIsSubmitting(false);

      if (!uploadRes.success) {
        // Requirement 8 & 9:
        // "If document upload fails, clearly tell the user that the portfolio item was created but the document upload failed. Do not silently lose the portfolio item."
        onSuccess(); // Refresh parent list so the new portfolio item is displayed!
        setError(
          `Portfolio item was successfully ${isEditing ? "updated" : "created"}, but document upload failed: ${uploadRes.error}`
        );
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } else {
      setIsSubmitting(false);
    }

    onSuccess();
    onClose();
  };

  const getIssuerPlaceholder = () => {
    switch (itemType) {
      case "certification":
        return "e.g. NCISM, CCRAS, Quality Council of India";
      case "publication":
        return "e.g. Journal of Ayurveda and Integrative Medicine";
      case "research":
      case "project":
        return "e.g. National Institute of Ayurveda, AYUSH Lab";
      case "workshop":
        return "e.g. All India Institute of Ayurveda";
      default:
        return "e.g. Organization, University, or Institution";
    }
  };

  const getAchievementPlaceholder = () => {
    switch (itemType) {
      case "publication":
        return "e.g. DOI: 10.1016/j.jaim.2025.100 or Volume 16 Issue 2";
      case "certification":
        return "e.g. Grade A Distinction, Credential ID: AYU-9921";
      case "achievement":
        return "e.g. 1st Prize State Ayush Innovation Challenge";
      default:
        return "e.g. Key outcome, measurable impact, or distinction";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Portfolio Evidence" : "Add Portfolio Evidence"}
      description="Record student-verified academic and clinical evidence into your digital portfolio."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-ayush-green hover:bg-ayush-green/90 text-white min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? "Save Changes" : "Add to Portfolio"}</span>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Item Type Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="item_type" className="text-xs font-semibold text-ayush-dark">
            Evidence Type *
          </Label>
          <select
            id="item_type"
            value={itemType}
            onChange={(e) => setItemType(e.target.value as PortfolioItemType)}
            className="w-full h-10 px-3 rounded-lg border border-ayush-border bg-white text-ayush-dark text-sm focus:outline-none focus:ring-2 focus:ring-ayush-green/30"
          >
            {ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.description}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold text-ayush-dark">
            Title / Milestone Name *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Advanced Panchakarma Clinical Practice Certificate"
            required
            className="text-sm"
          />
        </div>

        {/* Issuer / Organization */}
        <div className="space-y-1.5">
          <Label htmlFor="issuer" className="text-xs font-semibold text-ayush-dark">
            Issuer / Organization / Publisher
          </Label>
          <Input
            id="issuer"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder={getIssuerPlaceholder()}
            className="text-sm"
          />
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start_date" className="text-xs font-semibold text-ayush-dark">
              Start Date
            </Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_date" className="text-xs font-semibold text-ayush-dark">
              Completion / End Date
            </Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Reference URL & Achievement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reference_url" className="text-xs font-semibold text-ayush-dark">
              Reference / Verification URL
            </Label>
            <Input
              id="reference_url"
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="achievement" className="text-xs font-semibold text-ayush-dark">
              Achievement / Key Outcome / DOI
            </Label>
            <Input
              id="achievement"
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              placeholder={getAchievementPlaceholder()}
              className="text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold text-ayush-dark">
            Description & Key Learnings
          </Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the clinical focus, research methodology, tools used, or practical scope..."
            className="text-sm"
          />
        </div>

        {/* Supporting Document Upload Field */}
        <div className="space-y-1.5 pt-1 border-t border-ayush-border/50">
          <div className="flex items-center justify-between">
            <Label htmlFor="supporting_document" className="text-xs font-semibold text-ayush-dark flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-ayush-green" />
              <span>Supporting Document</span>
            </Label>
            <span className="text-[11px] text-ayush-muted">
              PDF, JPG, PNG — Maximum 5 MB
            </span>
          </div>

          {existingDocument && !selectedFile && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-ayush-sand/30 border border-ayush-border/60 text-xs mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-ayush-green shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-ayush-dark truncate block">
                    {existingDocument.file_name}
                  </span>
                  <span className="text-[10px] text-ayush-muted">
                    Currently attached • {formatFileSize(Number(existingDocument.file_size))}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-ayush-teal font-medium shrink-0">
                Retained unless replaced
              </span>
            </div>
          )}

          {selectedFile ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-4 h-4 text-ayush-green shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-emerald-900 truncate block">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Ready to attach • {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={fileInputRef}
                id="supporting_document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                className="w-full text-xs text-ayush-dark file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-ayush-sand file:text-ayush-brown hover:file:bg-ayush-sand/80 file:cursor-pointer cursor-pointer border border-ayush-border rounded-lg p-1.5 bg-white"
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
