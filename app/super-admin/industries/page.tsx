import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { IndustryTable, OrganizationRow } from "./industry-table";
import { Briefcase } from "lucide-react";

async function IndustriesContent() {
  const { profile } = await requireSuperAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let organizationRows: OrganizationRow[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        data: { industries: OrganizationRow[] };
      }>("/super-admin/industries", {
        headers: { Cookie: `auth_token=${token}` },
      });
      organizationRows = res?.data?.industries || [];
    } catch {
      organizationRows = [];
    }
  }

  return (
    <DashboardShell
      userRole="super_admin"
      userName={profile.full_name || "Super Admin"}
      userEmail={profile.email}
      breadcrumbs={[
        { label: "Super Admin", href: "/super-admin/dashboard" },
        { label: "Industries" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ayush-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-ayush-green" />
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-ayush-dark">
                Industry & Partner Governance
              </h1>
            </div>
            <p className="text-xs text-ayush-muted mt-1">
              Review, approve, and moderate verified pharmaceutical manufacturers, clinical research institutes, and wellness partners
            </p>
          </div>
        </div>

        <IndustryTable initialOrganizations={organizationRows} />
      </div>
    </DashboardShell>
  );
}

export default function SuperAdminIndustriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Loading Industry Governance...
          </div>
        </div>
      }
    >
      <IndustriesContent />
    </Suspense>
  );
}
