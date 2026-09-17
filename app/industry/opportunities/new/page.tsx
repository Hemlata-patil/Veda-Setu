import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Suspense } from "react";
import { NewOpportunityForm } from "./new-opportunity-form";

export const metadata = {
  title: "Post Opportunity — VEDA SETU",
  description: "Create a new clinical internship, project, or apprenticeship with required competencies",
};

async function NewOpportunityPageContent() {
  const { user, profile } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let competencies: any[] = [];
  let orgName = "";

  try {
    const compRes = await apiFetch<{
      status: string;
      data: {
        competencies: Array<{
          id: string;
          name: string;
          category: string;
          description: string | null;
        }>;
      };
    }>("/competencies", {
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    });

    competencies = compRes.data.competencies || [];

    if (profile?.organization_id) {
      try {
        const orgsRes = await apiFetch<{
          status: string;
          data: {
            organizations: Array<{ id: string; name: string }>;
          };
        }>("/organizations", {
          headers: token ? { Cookie: `auth_token=${token}` } : undefined,
        });

        const matchedOrg = (orgsRes.data.organizations || []).find(
          (o) => o.id === profile.organization_id
        );
        if (matchedOrg?.name) {
          orgName = matchedOrg.name;
        }
      } catch {
        // If organization lookup fails, orgName stays empty (user can input it)
      }
    }
  } catch (err) {
    competencies = [];
  }

  return (
    <DashboardShell
      userRole="industry"
      userName={profile?.full_name || "Industry Partner"}
      userEmail={user.email || "partner@ayushindustry.org"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Industry Dashboard", href: "/industry/dashboard" },
        { label: "Opportunities", href: "/industry/opportunities" },
        { label: "New Opportunity" },
      ]}
    >
      <PageHeader
        eyebrow="Industry Postings"
        eyebrowColor="green"
        title="Post New Opportunity"
        description="Specify requirements, deadlines, and required Ayush competencies for automated student skill matching."
      />

      <div className="max-w-4xl">
        <NewOpportunityForm
          competencies={competencies || []}
          defaultOrgName={orgName}
        />
      </div>
    </DashboardShell>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Form...
          </div>
        </div>
      }
    >
      <NewOpportunityPageContent />
    </Suspense>
  );
}
