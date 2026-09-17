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
 * Express interest in a published faculty opportunity.
 * Caller must be an authenticated faculty user.
 */
export async function expressInterest(
  opportunityId: string,
  message?: string
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      `/faculty-collaboration/${opportunityId}/interest`,
      {
        method: "POST",
        headers: { Cookie: `auth_token=${token}` },
        body: JSON.stringify({ message: message?.trim() || undefined }),
      }
    );

    revalidatePath(`/faculty/collaboration/${opportunityId}`);
    revalidatePath("/faculty/collaboration/interests");
    revalidatePath("/faculty/dashboard");

    return {
      success: true,
      message: res.message || "Your interest has been submitted successfully.",
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Withdraw an expressed interest.
 * Allowed transitions: interested -> withdrawn, under_review -> withdrawn.
 */
export async function withdrawInterest(interestId: string): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      `/faculty-collaboration/interests/${interestId}/withdraw`,
      {
        method: "POST",
        headers: { Cookie: `auth_token=${token}` },
      }
    );

    revalidatePath("/faculty/collaboration");
    revalidatePath("/faculty/collaboration/interests");
    revalidatePath("/faculty/dashboard");

    return {
      success: true,
      message: res.message || "Your interest has been withdrawn.",
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Update message while status = 'interested'
 */
export async function updateInterestMessage(
  interestId: string,
  message: string
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      `/faculty-collaboration/interests/${interestId}/message`,
      {
        method: "PUT",
        headers: { Cookie: `auth_token=${token}` },
        body: JSON.stringify({ message: message.trim() }),
      }
    );

    revalidatePath("/faculty/collaboration/interests");

    return {
      success: true,
      message: res.message || "Your message has been updated.",
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Opportunity Owner action: Review interest status.
 * State machine enforced by backend:
 * interested -> under_review
 * under_review -> accepted / rejected
 */
export async function updateInterestStatus(
  interestId: string,
  newStatus: "under_review" | "accepted" | "rejected"
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      `/faculty-collaboration/interests/${interestId}/status`,
      {
        method: "PATCH",
        headers: { Cookie: `auth_token=${token}` },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    revalidatePath("/faculty/collaboration");
    revalidatePath("/faculty/collaboration/interests");

    return {
      success: true,
      message: res.message || `Interest status updated to ${newStatus}.`,
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Create a faculty opportunity.
 * Allowed creator roles: faculty, institution, industry.
 */
export async function createFacultyOpportunity(formData: {
  title: string;
  description: string;
  opportunity_type?: "fdp" | "workshop" | "research_project" | "industry_collaboration";
  opportunityType?: "fdp" | "workshop" | "research_project" | "industry_collaboration";
  provider_name?: string;
  providerName?: string;
  location?: string;
  mode?: "onsite" | "hybrid" | "remote";
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  application_deadline?: string;
  applicationDeadline?: string;
  external_url?: string;
  externalUrl?: string;
  status?: "draft" | "published";
  organization_id?: string;
}): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      opportunityType: formData.opportunity_type || formData.opportunityType,
      providerName: formData.provider_name?.trim() || formData.providerName?.trim() || undefined,
      location: formData.location?.trim() || undefined,
      mode: formData.mode || undefined,
      startDate: formData.start_date || formData.startDate || undefined,
      endDate: formData.end_date || formData.endDate || undefined,
      applicationDeadline: formData.application_deadline || formData.applicationDeadline || undefined,
      externalUrl: formData.external_url?.trim() || formData.externalUrl?.trim() || undefined,
      status: formData.status || "draft",
    };

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      "/faculty-collaboration",
      {
        method: "POST",
        headers: { Cookie: `auth_token=${token}` },
        body: JSON.stringify(payload),
      }
    );

    revalidatePath("/faculty/collaboration");
    revalidatePath("/faculty/collaboration/manage");

    return {
      success: true,
      message: res.message || `Opportunity created as ${res.data?.status || "draft"}.`,
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Update opportunity status (Owner only: created_by = auth.uid())
 */
export async function updateOpportunityStatus(
  opportunityId: string,
  status: "draft" | "published" | "closed" | "archived"
): Promise<ActionResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return { success: false, error: "Authentication required." };
    }

    const res = await apiFetch<{ status: string; message: string; data: any }>(
      `/faculty-collaboration/${opportunityId}/status`,
      {
        method: "PATCH",
        headers: { Cookie: `auth_token=${token}` },
        body: JSON.stringify({ status }),
      }
    );

    revalidatePath("/faculty/collaboration");
    revalidatePath(`/faculty/collaboration/${opportunityId}`);
    revalidatePath("/faculty/collaboration/manage");

    return {
      success: true,
      message: res.message || `Opportunity is now ${status}.`,
      data: res.data,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
