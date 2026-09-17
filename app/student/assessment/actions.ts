"use server";

import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export interface SaveAnswerParams {
  attemptId: string;
  questionId: string;
  answerValue?: number | null;
  answerText?: string | null;
}

export async function startAssessment(templateId: string) {
  const { user } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Authentication required.");
  }

  const res = await api.post<{
    status: string;
    data: { attemptId: string; status: string };
  }>(
    `/assessments/${templateId}/attempts`,
    {},
    { headers: { Cookie: `auth_token=${token}` } }
  );

  if (!res?.data?.attemptId) {
    throw new Error("Failed to initialize assessment attempt.");
  }

  revalidatePath("/student/dashboard");
  revalidatePath("/student/assessment");
  return { attemptId: res.data.attemptId, status: res.data.status };
}

export async function saveAnswer(params: SaveAnswerParams) {
  const { user } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return { success: false, error: "Authentication required." };
  }

  const res = await api.post<{
    status: string;
    message: string;
    data: { savedCount: number };
  }>(
    `/assessments/attempts/${params.attemptId}/answers`,
    {
      questionId: params.questionId,
      answerValue: params.answerValue,
      answerText: params.answerText,
    },
    { headers: { Cookie: `auth_token=${token}` } }
  );

  if (res?.status === "success") {
    return { success: true };
  }

  return { success: false, error: "Failed to save answer." };
}

export async function submitAssessment(attemptId: string) {
  const { user } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Authentication required.");
  }

  const res = await api.post<{
    status: string;
    message: string;
    data: {
      attemptId: string;
      totalScore: number;
      submittedAt: string;
      competencyScores: any[];
    };
  }>(
    `/assessments/attempts/${attemptId}/complete`,
    {},
    { headers: { Cookie: `auth_token=${token}` } }
  );

  if (res?.status === "success" && res.data) {
    revalidatePath("/student/dashboard");
    revalidatePath("/student/assessment");
    revalidatePath(`/student/assessment/${attemptId}`);
    revalidatePath(`/student/assessment/result/${attemptId}`);

    return {
      success: true,
      totalScore: res.data.totalScore,
      redirectUrl: `/student/assessment/result/${attemptId}`,
    };
  }

  throw new Error("Failed to submit assessment.");
}
