"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";

export interface RequestMentorshipParams {
  facultyId: string;
  requestNote?: string;
}

export async function requestMentorship(params: RequestMentorshipParams) {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Authentication required.");
  }

  if (!params.facultyId) {
    throw new Error("Faculty mentor selection is required.");
  }

  const res = await apiFetch<{
    status: string;
    message: string;
    data: { id: string };
  }>("/mentorship/student/request", {
    method: "POST",
    headers: {
      Cookie: `auth_token=${token}`,
    },
    body: JSON.stringify({
      facultyId: params.facultyId,
      requestNote: params.requestNote?.trim() || undefined,
    }),
  });

  revalidatePath("/student/dashboard");
  revalidatePath("/student/mentorship");
  revalidatePath("/faculty/mentorship");

  return { success: true, mentorshipId: res.data?.id };
}
