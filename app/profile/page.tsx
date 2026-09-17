import { requireAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile-form";
import { UserRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

import { Suspense } from "react";

export const metadata = {
  title: "My Profile — VEDA SETU",
  description: "View and manage your academic and professional Ayush profile",
};

async function ProfilePageContent() {
  const { user, profile } = await requireAuth();

  const role: UserRole = profile?.role || "student";
  const dashboardPath = role === "super_admin" ? "/super-admin/dashboard" : `/${role}/dashboard`;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let approvedInstitutions: Array<{ id: string; name: string; code: string | null }> = [];
  let currentInstitutionName: string | null = null;

  if (token) {
    try {
      const instRes = await api.get<{
        status: string;
        data: { institutions: Array<{ id: string; name: string; code: string | null }> };
      }>("/institutions", {
        headers: {
          Cookie: `auth_token=${token}`,
        },
      });
      approvedInstitutions = instRes?.data?.institutions || [];
    } catch {
      // Fallback
    }

    if (profile?.institution_id) {
      const matched = approvedInstitutions.find((inst) => inst.id === profile.institution_id);
      currentInstitutionName = matched?.name || null;
    }
  }

  return (
    <DashboardShell
      userRole={role}
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "user@ayush.edu.in"}
      breadcrumbs={[
        { label: "Dashboard", href: dashboardPath },
        { label: "My Profile" },
      ]}
    >
      <PageHeader
        eyebrow="Account & Identity"
        eyebrowColor={role === "student" ? "green" : role === "faculty" ? "saffron" : "brown"}
        title="Personal Profile & Academic Coordinates"
        description="Review your account authorization, manage personal contact info, and update your academic specialization."
      />

      {profile && (
        <ProfileForm
          profile={profile}
          email={user.email!}
          institutions={approvedInstitutions || []}
          currentInstitutionName={currentInstitutionName}
        />
      )}
    </DashboardShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Profile...
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
