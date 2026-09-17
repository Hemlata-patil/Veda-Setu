import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export type UserRole = "student" | "faculty" | "institution" | "industry" | "super_admin";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  institution_id: string | null;
  organization_id: string | null;
  program: string | null;
  year: number | null;
  department: string | null;
  designation?: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendAuthMeResponse {
  status: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    department: string | null;
    institutionId: string | null;
    organizationId: string | null;
    designation: string | null;
    createdAt: string;
  };
}

interface BackendProfileResponse {
  status: string;
  data: {
    profile: {
      id: string;
      email: string;
      role: UserRole;
      fullName: string;
      phone: string | null;
      institutionId: string | null;
      institutionName?: string | null;
      program: string | null;
      year: number | null;
      department: string | null;
      designation: string | null;
      avatarUrl: string | null;
      createdAt: string;
      updatedAt: string;
    };
  };
}

/**
 * Requires an authenticated user session.
 * Strictly verifies HttpOnly auth_token cookie against authoritative Express backend.
 * Redirects to /auth/login if unauthenticated or token is invalid.
 */
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  try {
    const meRes = await apiFetch<BackendAuthMeResponse>("/auth/me", {
      headers: {
        Cookie: `auth_token=${token}`,
      },
    });

    if (!meRes?.user?.id) {
      redirect("/auth/login");
    }

    let profileData: BackendProfileResponse["data"]["profile"] | null = null;
    try {
      const profRes = await apiFetch<BackendProfileResponse>("/profile", {
        headers: {
          Cookie: `auth_token=${token}`,
        },
      });
      profileData = profRes?.data?.profile || null;
    } catch {
      // Fallback to meRes user fields
    }

    const user = {
      id: meRes.user.id,
      email: meRes.user.email,
      app_metadata: {},
      user_metadata: { full_name: meRes.user.fullName },
      aud: "authenticated",
      created_at: meRes.user.createdAt,
    };

    const profile: UserProfile = {
      id: meRes.user.id,
      full_name: profileData?.fullName || meRes.user.fullName || "Ayush User",
      email: meRes.user.email,
      role: meRes.user.role,
      phone: profileData?.phone || null,
      institution_id: profileData?.institutionId || meRes.user.institutionId || null,
      organization_id: meRes.user.organizationId || null,
      program: profileData?.program || null,
      year: profileData?.year || null,
      department: profileData?.department || meRes.user.department || null,
      designation: profileData?.designation || meRes.user.designation || null,
      avatar_url: profileData?.avatarUrl || null,
      created_at: profileData?.createdAt || meRes.user.createdAt,
      updated_at: profileData?.updatedAt || meRes.user.createdAt,
    };

    return {
      user,
      profile,
    };
  } catch {
    redirect("/auth/login");
  }
}

export function getRoleDashboardPath(role: UserRole | string): string {
  if (role === "super_admin") {
    return "/super-admin/dashboard";
  }
  return `/${role}/dashboard`;
}

/**
 * Enforces role-based authorization based strictly on the authoritative database profiles.
 * If the user has a different role, redirects them to their correct role dashboard.
 * A super_admin opening any standard role dashboard is redirected to /super-admin/dashboard.
 */
export async function requireRole(expectedRole: UserRole) {
  const { user, profile } = await requireAuth();

  if (!profile || !profile.role) {
    redirect("/profile");
  }

  const currentRole = profile.role as UserRole;

  if (currentRole !== expectedRole) {
    if (currentRole === "super_admin") {
      redirect("/super-admin/dashboard");
    }
    redirect(getRoleDashboardPath(currentRole));
  }

  return {
    user,
    profile: profile as UserProfile,
  };
}

/**
 * Reusable server-side authorization function for Super Admin routes and actions.
 * Strictly verifies the authenticated user has profile.role = 'super_admin'.
 * Unauthorized users are redirected to their own role dashboard or /auth/login.
 */
export async function requireSuperAdmin() {
  const { user, profile } = await requireAuth();

  if (!profile || profile.role !== "super_admin") {
    if (profile?.role) {
      redirect(getRoleDashboardPath(profile.role));
    }
    redirect("/auth/login");
  }

  return {
    user,
    profile: profile as UserProfile,
  };
}
