"use server";

import { api } from "@/lib/api";

export interface RegisterStudentParams {
  fullName: string;
  email: string;
  password: string;
  role?: "student";
}

/**
 * Public Student Registration Action
 * Wraps Express POST /api/auth/register
 */
export async function registerStudentAccount(params: RegisterStudentParams) {
  const fullName = params.fullName?.trim();
  const email = params.email?.trim().toLowerCase();
  const password = params.password;

  if (!fullName) {
    throw new Error("Full name is required.");
  }
  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const res = await api.post<{
    status: string;
    message: string;
    user: { id: string };
  }>("/auth/register", {
    fullName,
    email,
    password,
    role: "student",
  });

  return {
    success: true,
    userId: res.user?.id,
  };
}
