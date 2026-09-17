import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstitutionTable, InstitutionRow } from "./institution-table";
import { Building2 } from "lucide-react";

async function InstitutionsContent() {
  const { profile } = await requireSuperAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let institutionRows: InstitutionRow[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        data: { institutions: InstitutionRow[] };
      }>("/super-admin/institutions", {
        headers: { Cookie: `auth_token=${token}` },
      });
      institutionRows = res?.data?.institutions || [];
    } catch {
      institutionRows = [];
    }
  }

  return (
    <DashboardShell
      userRole="super_admin"
      userName={profile.full_name || "Super Admin"}
      userEmail={profile.email}
      breadcrumbs={[
        { label: "Super Admin", href: "/super-admin/dashboard" },
        { label: "Institutions" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ayush-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-ayush-brown" />
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-ayush-dark">
                Institution Governance
              </h1>
            </div>
            <p className="text-xs text-ayush-muted mt-1">
              Review, approve, and oversee affiliated Ayurveda academic institutions and universities
            </p>
          </div>
        </div>

        <InstitutionTable initialInstitutions={institutionRows} />
      </div>
    </DashboardShell>
  );
}

export default function SuperAdminInstitutionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Loading Institution Governance...
          </div>
        </div>
      }
    >
      <InstitutionsContent />
    </Suspense>
  );
}
