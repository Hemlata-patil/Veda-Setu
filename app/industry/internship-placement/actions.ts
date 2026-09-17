"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
};

/**
 * Start tracking an internship/placement for a selected application.
 * Caller must be the industry owner who created the opportunity for this application.
 */
export async function createPlacementTracking(formData: {
  applicationId: string;
  engagementType: "internship" | "placement";
  startDate?: string;
  expectedEndDate?: string;
  supervisorName?: string;
  supervisorEmail?: string;
}): Promise<ActionResponse> {
  try {
    const { user } = await requireRole("industry");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const payload = {
      applicationId: formData.applicationId,
      engagementType: formData.engagementType,
      startDate: formData.startDate || undefined,
      expectedEndDate: formData.expectedEndDate || undefined,
      supervisorName: formData.supervisorName?.trim() || undefined,
      supervisorEmail: formData.supervisorEmail?.trim() || undefined,
    };

    const res = await apiFetch<{ status: string; message: string; data: any }>("/placements", {
      method: "POST",
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
      body: JSON.stringify(payload),
    });

    revalidatePath("/industry/internship-placement");
    revalidatePath("/industry/dashboard");
    revalidatePath("/student/internship-placement");

    return {
      success: true,
      message: res.message || "Internship / Placement tracking initiated successfully.",
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Update an existing placement tracking record.
 */
export async function updatePlacementTracking(
  placementId: string,
  updates: {
    status?: "selected" | "offer_accepted" | "joined" | "in_progress" | "completed" | "withdrawn";
    startDate?: string;
    expectedEndDate?: string;
    actualEndDate?: string;
    progressPercent?: number;
    supervisorName?: string;
    supervisorEmail?: string;
    outcome?: string;
  }
): Promise<ActionResponse> {
  try {
    const { user } = await requireRole("industry");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const payload: Record<string, any> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.startDate !== undefined) payload.startDate = updates.startDate || null;
    if (updates.expectedEndDate !== undefined) payload.expectedEndDate = updates.expectedEndDate || null;
    if (updates.actualEndDate !== undefined) payload.actualEndDate = updates.actualEndDate || null;
    if (updates.progressPercent !== undefined) payload.progressPercent = Number(updates.progressPercent);
    if (updates.supervisorName !== undefined) payload.supervisorName = updates.supervisorName?.trim() || null;
    if (updates.supervisorEmail !== undefined) payload.supervisorEmail = updates.supervisorEmail?.trim() || null;
    if (updates.outcome !== undefined) payload.outcome = updates.outcome?.trim() || null;

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      `/placements/${placementId}`,
      {
        method: "PATCH",
        headers: token ? { Cookie: `auth_token=${token}` } : undefined,
        body: JSON.stringify(payload),
      }
    );

    revalidatePath("/industry/internship-placement");
    revalidatePath("/industry/dashboard");
    revalidatePath("/student/internship-placement");
    revalidatePath("/institution/internship-placement");

    return {
      success: true,
      message: res.message || "Placement tracking updated successfully.",
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
