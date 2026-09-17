"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Authentication required.");
  return { Cookie: `auth_token=${token}` };
}

/**
 * Super Admin Action: Update Institution Verification Status
 */
export async function updateInstitutionStatus(
  institutionId: string,
  status: VerificationStatus
) {
  await requireSuperAdmin();

  if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
    throw new Error("Invalid institution verification status");
  }

  const authHeader = await getAuthHeader();
  await api.patch(
    `/super-admin/institutions/${institutionId}/status`,
    { status },
    { headers: authHeader }
  );

  revalidatePath("/super-admin/institutions");
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/analytics");
  return { success: true };
}

/**
 * Super Admin Action: Update Organization Verification Status
 */
export async function updateOrganizationStatus(
  organizationId: string,
  status: VerificationStatus
) {
  await requireSuperAdmin();

  if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
    throw new Error("Invalid organization verification status");
  }

  const authHeader = await getAuthHeader();
  await api.patch(
    `/super-admin/industries/${organizationId}/status`,
    { status },
    { headers: authHeader }
  );

  revalidatePath("/super-admin/industries");
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/analytics");
  return { success: true };
}

/**
 * Super Admin Action: Moderate Opportunity Status (close / archive / publish)
 */
export async function moderateOpportunityStatus(
  opportunityId: string,
  status: "published" | "closed" | "archived"
) {
  await requireSuperAdmin();

  if (!["published", "closed", "archived"].includes(status)) {
    throw new Error("Invalid opportunity moderation status");
  }

  const authHeader = await getAuthHeader();
  await api.patch(
    `/super-admin/opportunities/${opportunityId}/status`,
    { status },
    { headers: authHeader }
  );

  revalidatePath("/super-admin/opportunities");
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/analytics");
  return { success: true };
}

/**
 * Super Admin Action: Safely update user role between non-admin roles.
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: "student" | "faculty" | "institution" | "industry"
) {
  await requireSuperAdmin();

  const allowedRoles = ["student", "faculty", "institution", "industry"];
  if (!allowedRoles.includes(newRole)) {
    throw new Error("Invalid target role assignment.");
  }

  const authHeader = await getAuthHeader();
  await api.patch(
    `/super-admin/users/${targetUserId}/role`,
    { role: newRole },
    { headers: authHeader }
  );

  revalidatePath("/super-admin/users");
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/analytics");
  return { success: true };
}

export interface CreateInstitutionParams {
  name: string;
  code?: string;
  category?: string;
  location?: string;
  adminFullName: string;
  adminEmail: string;
  temporaryPassword: string;
}

/**
 * Super Admin Action: Add an Institution and provision its initial Administrator Login Account.
 */
export async function createInstitutionWithAdmin(params: CreateInstitutionParams) {
  await requireSuperAdmin();

  const authHeader = await getAuthHeader();
  const res = await api.post<{
    status: string;
    message: string;
    institutionId: string;
    institutionName: string;
    userId: string;
  }>("/super-admin/institutions", params, { headers: authHeader });

  revalidatePath("/super-admin/institutions");
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/analytics");

  return {
    success: true,
    institutionId: res.institutionId,
    institutionName: res.institutionName,
    userId: res.userId,
  };
}

export interface CreateIndustryParams {
  name: string;
  organizationType?: string;
  location?: string;
  contactFullName: string;
  contactEmail: string;
  temporaryPassword: string;
}

/**
 * Super Admin Action: Add an Industry/Organization and provision its initial Login Account.
 */
export async function createIndustryWithAdmin(params: CreateIndustryParams) {
  await requireSuperAdmin();

  const authHeader = await getAuthHeader();
  const res = await api.post<{
    status: string;
    message: string;
    organizationId: string;
    organizationName: string;
    userId: string;
  }>("/super-admin/industries", params, { headers: authHeader });

  revalidatePath("/super-admin/industries");
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/analytics");

  return {
    success: true,
    organizationId: res.organizationId,
    organizationName: res.organizationName,
    userId: res.userId,
  };
}
