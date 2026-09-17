"use server";

import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export interface ApplyToOpportunityParams {
  opportunityId: string;
  coverNote?: string;
}

export async function applyToOpportunity(params: ApplyToOpportunityParams) {
  const { user } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!params.opportunityId) {
    throw new Error("Opportunity ID is required.");
  }

  if (!token) {
    throw new Error("Authentication required.");
  }

  const res = await api.post<{
    status: string;
    message: string;
    data: { applicationId: string };
  }>(
    `/opportunities/${params.opportunityId}/applications`,
    { coverNote: params.coverNote },
    { headers: { Cookie: `auth_token=${token}` } }
  );

  revalidatePath(`/student/opportunities/${params.opportunityId}`);
  revalidatePath("/student/opportunities");
  revalidatePath("/student/applications");
  revalidatePath("/industry/applications");

  return { success: true, applicationId: res.data.applicationId };
}

export async function withdrawApplication(applicationId: string) {
  const { user } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!applicationId) {
    throw new Error("Application ID is required.");
  }

  if (!token) {
    throw new Error("Authentication required.");
  }

  await api.post(
    `/applications/${applicationId}/withdraw`,
    {},
    { headers: { Cookie: `auth_token=${token}` } }
  );

  revalidatePath("/student/opportunities");
  revalidatePath("/student/applications");
  revalidatePath("/industry/applications");

  return { success: true };
}
