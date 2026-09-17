"use server";

import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export interface CreateFacultyParams {
  fullName: string;
  email: string;
  department: string;
  designation: string;
  temporaryPassword: string;
}

/**
 * Institution Action: Create a Faculty account affiliated with the authenticated Institution.
 * Strictly authorized for role = 'institution'.
 * Calls Express backend POST /api/institution/faculty.
 */
export async function createFacultyAccount(params: CreateFacultyParams) {
  await requireRole("institution");

  const fullName = params.fullName?.trim();
  const email = params.email?.trim().toLowerCase();
  const department = params.department?.trim();
  const designation = params.designation?.trim();
  const temporaryPassword = params.temporaryPassword;

  if (!fullName) throw new Error("Faculty full name is required.");
  if (!email || !email.includes("@")) throw new Error("Valid faculty email is required.");
  if (!department) throw new Error("Academic department is required.");
  if (!designation) throw new Error("Faculty designation is required.");
  if (!temporaryPassword || temporaryPassword.length < 6) {
    throw new Error("Temporary password must be at least 6 characters long.");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Authentication required.");

  const res = await api.post<{
    status: string;
    message: string;
    facultyId: string;
  }>(
    "/institution/faculty",
    {
      fullName,
      email,
      department,
      designation,
      temporaryPassword,
    },
    {
      headers: { Cookie: `auth_token=${token}` },
    }
  );

  revalidatePath("/institution/faculty");
  revalidatePath("/institution/dashboard");
  revalidatePath("/institution/analytics");

  return {
    success: true,
    facultyId: res.facultyId,
  };
}
