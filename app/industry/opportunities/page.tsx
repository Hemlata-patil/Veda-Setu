import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, PlusCircle, Calendar, MapPin, Award } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { OpportunityActions } from "./opportunity-actions";

export const metadata = {
  title: "Industry Opportunities — VEDA SETU",
  description: "Manage clinical internships, research projects, and required competencies",
};

async function IndustryOpportunitiesContent() {
  const { user, profile } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let opportunities: any[] = [];

  try {
    const oppsRes = await apiFetch<{
      status: string;
      data: {
        opportunities: Array<any>;
      };
    }>("/industry/opportunities", {
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    });

    opportunities = (oppsRes.data.opportunities || []).map((opp: any) => ({
      ...opp,
      opportunity_competencies: opp.opportunity_competencies || opp.requirements || [],
    }));
  } catch (err) {
    opportunities = [];
  }

  return (
    <DashboardShell
      userRole="industry"
      userName={profile?.full_name || "Industry Partner"}
      userEmail={user.email || "partner@ayushindustry.org"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Industry Dashboard", href: "/industry/dashboard" },
        { label: "Opportunities" },
      ]}
    >
      <PageHeader
        eyebrow="Industry Opportunities"
        eyebrowColor="green"
        title="Manage Opportunities"
        description="Publish clinical internships, projects, and apprenticeships with defined Ayush competency requirements."
        actions={
          <Button asChild size="sm" variant="default" className="gap-2">
            <Link href="/industry/opportunities/new">
              <PlusCircle className="w-4 h-4" />
              <span>Post Opportunity</span>
            </Link>
          </Button>
        }
      />

      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {opportunities.map((opp) => {
              const compCount = opp.opportunity_competencies?.length || 0;
              const statusBadgeVariant =
                opp.status === "published"
                  ? "herbal"
                  : opp.status === "draft"
                  ? "parchment"
                  : "outline";

              return (
                <Card key={opp.id} className="p-5 hover:border-ayush-border transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-lg font-semibold text-ayush-dark">
                          {opp.title}
                        </h3>
                        <Badge variant={statusBadgeVariant} className="capitalize text-[11px]">
                          {opp.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-[11px] text-ayush-muted">
                          {opp.opportunity_type?.replace(/_/g, " ")}
                        </Badge>
                        {opp.work_mode && (
                          <Badge variant="parchment" className="capitalize text-[10px]">
                            {opp.work_mode}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-ayush-muted line-clamp-2 leading-relaxed">
                        {opp.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-ayush-muted pt-1">
                        {opp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-ayush-brown/70" />
                            {opp.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-ayush-brown/70" />
                          {opp.application_deadline ? `Deadline: ${opp.application_deadline}` : "No deadline"}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-ayush-dark">
                          <Award className="w-3.5 h-3.5 text-ayush-gold" />
                          {compCount} {compCount === 1 ? "Competency" : "Competencies"} Required
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-ayush-border/60">
                      <OpportunityActions
                        opportunityId={opp.id}
                        currentStatus={opp.status as any}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ayush-sand/80 text-ayush-brown border border-ayush-border/70">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-heading text-xl font-semibold text-ayush-dark">
                No Opportunities Created Yet
              </h3>
              <p className="text-xs text-ayush-muted leading-relaxed">
                Create structured postings to match with verified Ayush scholars based on their evaluated competencies.
              </p>
            </div>
            <Button asChild size="sm" variant="default" className="gap-2">
              <Link href="/industry/opportunities/new">
                <PlusCircle className="w-4 h-4" />
                <span>Post Your First Opportunity</span>
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}

export default function IndustryOpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Opportunities...
          </div>
        </div>
      }
    >
      <IndustryOpportunitiesContent />
    </Suspense>
  );
}
