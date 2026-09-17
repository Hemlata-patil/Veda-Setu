import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OpportunityModerationTable, OpportunityRow } from "./opportunity-table";
import { FileCheck2 } from "lucide-react";

async function OpportunitiesContent() {
  const { profile } = await requireSuperAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let opportunityRows: OpportunityRow[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        data: { opportunities: OpportunityRow[] };
      }>("/super-admin/opportunities", {
        headers: { Cookie: `auth_token=${token}` },
      });
      opportunityRows = res?.data?.opportunities || [];
    } catch {
      opportunityRows = [];
    }
  }

  return (
    <DashboardShell
      userRole="super_admin"
      userName={profile.full_name || "Super Admin"}
      userEmail={profile.email}
      breadcrumbs={[
        { label: "Super Admin", href: "/super-admin/dashboard" },
        { label: "Opportunities" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ayush-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-ayush-saffron" />
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-ayush-dark">
                Opportunity Moderation
              </h1>
            </div>
            <p className="text-xs text-ayush-muted mt-1">
              Oversee and moderate listings across AYUSH internships, clinical projects, research fellowships, and jobs
            </p>
          </div>
        </div>

        <OpportunityModerationTable initialOpportunities={opportunityRows} />
      </div>
    </DashboardShell>
  );
}

export default function SuperAdminOpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Loading Opportunity Moderation...
          </div>
        </div>
      }
    >
      <OpportunitiesContent />
    </Suspense>
  );
}
