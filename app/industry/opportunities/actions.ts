"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { OpportunityType, OpportunityStatus, WorkMode } from "@/lib/opportunities";

export interface CreateOpportunityParams {
  title: string;
  description: string;
  opportunityType: OpportunityType;
  location?: string;
  workMode?: WorkMode;
  eligibility?: string;
  applicationDeadline?: string;
  organizationName?: string;
  status: "draft" | "published";
  requiredCompetencies: Array<{
    competencyId: string;
    requiredScore: number;
    weight?: number;
  }>;
}

export async function createOpportunity(params: CreateOpportunityParams) {
  const { user } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await apiFetch<{
    status: string;
    message: string;
    data: { opportunityId: string };
  }>("/industry/opportunities", {
    method: "POST",
    body: JSON.stringify({
      title: params.title.trim(),
      description: params.description.trim(),
      opportunityType: params.opportunityType,
      location: params.location?.trim() || null,
      workMode: params.workMode || null,
      eligibility: params.eligibility?.trim() || null,
      applicationDeadline: params.applicationDeadline || null,
      organizationName: params.organizationName?.trim() || null,
      status: params.status,
      requiredCompetencies: (params.requiredCompetencies || []).map((rc) => ({
        competencyId: rc.competencyId,
        requiredScore: Math.min(100, Math.max(0, Number(rc.requiredScore) || 60)),
        weight: rc.weight && rc.weight > 0 ? Number(rc.weight) : 1,
      })),
    }),
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/industry/dashboard");
  revalidatePath("/industry/opportunities");
  revalidatePath("/student/opportunities");

  return { success: true, opportunityId: res.data.opportunityId };
}

export async function updateOpportunityStatus(
  opportunityId: string,
  newStatus: OpportunityStatus
) {
  const { user } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  await apiFetch(`/industry/opportunities/${opportunityId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/industry/dashboard");
  revalidatePath("/industry/opportunities");
  revalidatePath("/student/opportunities");

  return { success: true };
}

export async function deleteOpportunity(opportunityId: string) {
  const { user } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  await apiFetch(`/industry/opportunities/${opportunityId}`, {
    method: "DELETE",
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/industry/dashboard");
  revalidatePath("/industry/opportunities");
  revalidatePath("/student/opportunities");

  return { success: true };
}
