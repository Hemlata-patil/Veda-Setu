"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { ApplicationStatus } from "@/lib/applications";

export interface UpdateCandidateStatusParams {
  applicationId: string;
  newStatus: ApplicationStatus;
}

export async function updateCandidateStatus(params: UpdateCandidateStatusParams) {
  const { user } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!params.applicationId || !params.newStatus) {
    throw new Error("Application ID and target status are required.");
  }

  await apiFetch(`/industry/applications/${params.applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: params.newStatus }),
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/industry/applications");
  revalidatePath(`/industry/applications/${params.applicationId}`);
  revalidatePath("/student/applications");

  return { success: true };
}
