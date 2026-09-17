"use server";

import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";

export interface CreateMentorshipParams {
  studentId: string;
  mentorNote?: string;
}

export async function createMentorship(params: CreateMentorshipParams) {
  const { user } = await requireRole("faculty");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await apiFetch<{
    status: string;
    message: string;
    data: { id: string };
  }>("/mentorship/faculty/initiate", {
    method: "POST",
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    body: JSON.stringify({
      studentId: params.studentId,
      mentorNote: params.mentorNote?.trim() || undefined,
    }),
  });

  revalidatePath("/faculty/dashboard");
  revalidatePath("/faculty/students");
  revalidatePath(`/faculty/students/${params.studentId}`);
  revalidatePath("/faculty/mentorship");

  return { success: true, mentorshipId: res.data?.id };
}

export interface UpdateMentorshipNoteParams {
  mentorshipId: string;
  mentorNote: string;
}

export async function updateMentorshipNote(params: UpdateMentorshipNoteParams) {
  const { user } = await requireRole("faculty");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  await apiFetch(`/mentorship/faculty/mentees/${params.mentorshipId}/note`, {
    method: "PUT",
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    body: JSON.stringify({
      mentorNote: params.mentorNote.trim(),
    }),
  });

  revalidatePath("/faculty/dashboard");
  revalidatePath("/faculty/students");
  revalidatePath("/faculty/mentorship");

  return { success: true };
}

export async function completeMentorship(param: string | { mentorshipId: string }) {
  const { user } = await requireRole("faculty");
  const mentorshipId = typeof param === "string" ? param : param.mentorshipId;
  if (!mentorshipId) {
    throw new Error("Mentorship ID is required.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  await apiFetch(`/mentorship/faculty/mentees/${mentorshipId}/complete`, {
    method: "POST",
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/faculty/dashboard");
  revalidatePath("/faculty/students");
  revalidatePath("/faculty/mentorship");

  return { success: true };
}

export async function acceptMentorshipRequest(param: string | { mentorshipId: string }) {
  const { user } = await requireRole("faculty");
  const mentorshipId = typeof param === "string" ? param : param.mentorshipId;
  if (!mentorshipId) {
    throw new Error("Mentorship ID is required.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  await apiFetch(`/mentorship/faculty/requests/${mentorshipId}/accept`, {
    method: "POST",
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/faculty/dashboard");
  revalidatePath("/faculty/students");
  revalidatePath("/faculty/mentorship");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/mentorship");

  return { success: true };
}

export async function rejectMentorshipRequest(param: string | { mentorshipId: string }) {
  const { user } = await requireRole("faculty");
  const mentorshipId = typeof param === "string" ? param : param.mentorshipId;
  if (!mentorshipId) {
    throw new Error("Mentorship ID is required.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  await apiFetch(`/mentorship/faculty/requests/${mentorshipId}/reject`, {
    method: "POST",
    headers: token ? { Cookie: `auth_token=${token}` } : undefined,
  });

  revalidatePath("/faculty/dashboard");
  revalidatePath("/faculty/students");
  revalidatePath("/faculty/mentorship");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/mentorship");

  return { success: true };
}
