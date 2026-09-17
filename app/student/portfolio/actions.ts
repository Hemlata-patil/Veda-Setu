"use server";

import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import {
  PortfolioItemInput,
  VALID_ITEM_TYPES,
  MAX_DOCUMENT_FILE_SIZE,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "./types";

function validatePortfolioInput(data: PortfolioItemInput) {
  if (!data.title || data.title.trim().length === 0) {
    throw new Error("Title is required and cannot be empty.");
  }

  if (!VALID_ITEM_TYPES.includes(data.item_type)) {
    throw new Error(`Invalid item type: ${data.item_type}`);
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end < start) {
      throw new Error("End date cannot be earlier than start date.");
    }
  }
}

export async function createPortfolioItem(data: PortfolioItemInput) {
  try {
    const { user } = await requireRole("student");
    validatePortfolioInput(data);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const payload = {
      itemType: data.item_type,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      issuerOrOrganization: data.issuer_or_organization?.trim() || null,
      startDate: data.start_date?.trim() || null,
      endDate: data.end_date?.trim() || null,
      referenceUrl: data.reference_url?.trim() || null,
      achievement: data.achievement?.trim() || null,
    };

    const res = await apiFetch<{ status: string; data: any }>("/portfolio/items", {
      method: "POST",
      headers: {
        Cookie: `auth_token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    revalidatePath("/student/portfolio");
    revalidatePath("/student/dashboard");

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("createPortfolioItem exception:", err);
    return { success: false, error: err.message || "Failed to create portfolio item" };
  }
}

export async function updatePortfolioItem(id: string, data: PortfolioItemInput) {
  try {
    const { user } = await requireRole("student");
    if (!id) {
      throw new Error("Portfolio item ID is required.");
    }
    validatePortfolioInput(data);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const payload = {
      itemType: data.item_type,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      issuerOrOrganization: data.issuer_or_organization?.trim() || null,
      startDate: data.start_date?.trim() || null,
      endDate: data.end_date?.trim() || null,
      referenceUrl: data.reference_url?.trim() || null,
      achievement: data.achievement?.trim() || null,
    };

    const res = await apiFetch<{ status: string; data: any }>(`/portfolio/items/${id}`, {
      method: "PATCH",
      headers: {
        Cookie: `auth_token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    revalidatePath("/student/portfolio");
    revalidatePath("/student/dashboard");

    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("updatePortfolioItem exception:", err);
    return { success: false, error: err.message || "Failed to update portfolio item" };
  }
}

export async function deletePortfolioItem(id: string) {
  try {
    const { user } = await requireRole("student");
    if (!id) {
      throw new Error("Portfolio item ID is required.");
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    await apiFetch<{ status: string }>(`/portfolio/items/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: `auth_token=${token}`,
      },
    });

    revalidatePath("/student/portfolio");
    revalidatePath("/student/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("deletePortfolioItem exception:", err);
    return { success: false, error: err.message || "Failed to delete portfolio item" };
  }
}

// =============================================================================
// DOCUMENT UPLOAD, REPLACEMENT, AND SIGNED URL RETRIEVAL
// =============================================================================

export async function uploadPortfolioDocument(formData: FormData) {
  try {
    const { user } = await requireRole("student");
    const portfolioItemId = formData.get("portfolio_item_id") as string;
    const file = formData.get("file") as File | null;

    if (!portfolioItemId) {
      return { success: false, error: "Portfolio item ID is required." };
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please select a valid document file." };
    }

    // 1. Server-side file size validation: max 5 MB (5242880 bytes)
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return { success: false, error: "File size must be 5 MB or smaller." };
    }

    // 2. Server-side MIME type validation
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) {
      return { success: false, error: "Only PDF, JPG, and PNG files are allowed." };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(
      `${apiBase}/portfolio/items/${portfolioItemId}/documents`,
      {
        method: "POST",
        headers: {
          Cookie: `auth_token=${token}`,
        },
        body: backendFormData,
      }
    );

    const json = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: json.message || `Document upload failed with status ${response.status}`,
      };
    }

    revalidatePath("/student/portfolio");
    return { success: true, data: json.data };
  } catch (err: any) {
    console.error("uploadPortfolioDocument exception:", err);
    return { success: false, error: err.message || "Failed to process document upload." };
  }
}

export async function deletePortfolioDocument(documentId: string) {
  try {
    const { user } = await requireRole("student");
    if (!documentId) {
      return { success: false, error: "Document ID is required." };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    await apiFetch<{ status: string }>(`/portfolio/documents/${documentId}`, {
      method: "DELETE",
      headers: {
        Cookie: `auth_token=${token}`,
      },
    });

    revalidatePath("/student/portfolio");
    return { success: true };
  } catch (err: any) {
    console.error("deletePortfolioDocument exception:", err);
    return { success: false, error: err.message || "Failed to delete document." };
  }
}

export async function getPortfolioDocumentSignedUrl(documentId: string) {
  try {
    const { user } = await requireRole("student");
    if (!documentId) {
      return { success: false, error: "Document ID is required." };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const res = await apiFetch<{
      status: string;
      data: { signedUrl: string; fileName: string };
    }>(`/portfolio/documents/${documentId}/signed-url`, {
      method: "GET",
      headers: {
        Cookie: `auth_token=${token}`,
      },
    });

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const serverBase = apiBase.replace(/\/api\/?$/, "");
    const fullUrl = res.data.signedUrl.startsWith("http")
      ? res.data.signedUrl
      : `${serverBase}${res.data.signedUrl}`;

    return { success: true, signedUrl: fullUrl, fileName: res.data.fileName };
  } catch (err: any) {
    console.error("getPortfolioDocumentSignedUrl exception:", err);
    return { success: false, error: err.message || "Failed to load document." };
  }
}
