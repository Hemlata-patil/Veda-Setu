"use server";

import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export interface UpdateProfileParams {
  fullName: string;
  phone?: string | null;
  department?: string | null;
  program?: string | null;
  year?: number | null;
  avatarUrl?: string | null;
  institutionId?: string | null;
}

/**
 * Server Action: Authorized Profile Update
 * Uses Express backend PUT /api/profile with auth_token cookie.
 * Role and email are strictly immutable.
 */
export async function updateProfile(params: UpdateProfileParams) {
  const { profile } = await requireAuth();

  const fullName = params.fullName?.trim();
  if (!fullName) {
    throw new Error("Full name is required.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Authentication required.");
  }

  const res = await api.put<{
    status: string;
    message: string;
    data: { profile: any };
  }>(
    "/profile",
    {
      fullName,
      phone: params.phone?.trim() || null,
      department: params.department?.trim() || null,
      program: params.program?.trim() || null,
      year: params.year !== undefined ? params.year : null,
      avatarUrl: params.avatarUrl?.trim() || null,
      institutionId:
        profile?.role === "student"
          ? params.institutionId?.trim() || null
          : undefined,
    },
    {
      headers: {
        Cookie: `auth_token=${token}`,
      },
    }
  );

  revalidatePath("/profile");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/mentorship");
  revalidatePath("/dashboard");

  return {
    success: true,
    institutionId: res?.data?.profile?.institutionId || null,
  };
}
