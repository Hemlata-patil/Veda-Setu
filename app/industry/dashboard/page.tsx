import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, PlusCircle, ArrowRight, User, CheckCircle2, Clock, Archive } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Industry Dashboard — VEDA SETU",
  description: "Ayush industry enterprise collaboration and talent discovery portal",
};

async function IndustryDashboardContent() {
  const { user, profile } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let opportunities: Array<{
    id: string;
    status: string;
    title: string;
    opportunity_type: string;
    application_deadline: string | null;
    created_at: string;
  }> = [];
  let publishedCount = 0;
  let draftCount = 0;
  let closedCount = 0;
  let totalCount = 0;
  let selectedCandidatesCount = 0;
  let activePlacementsCount = 0;

  try {
    const dashRes = await apiFetch<{
      status: string;
      data: {
        metrics: {
          totalOpportunities: number;
          publishedCount: number;
          draftCount: number;
          closedCount: number;
          selectedCandidatesCount: number;
          activePlacementsCount: number;
        };
        opportunities: Array<{
          id: string;
          status: string;
          title: string;
          opportunity_type: string;
          application_deadline: string | null;
          created_at: string;
        }>;
      };
    }>("/industry/dashboard", {
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    });

    opportunities = dashRes.data.opportunities || [];
    publishedCount = dashRes.data.metrics.publishedCount;
    draftCount = dashRes.data.metrics.draftCount;
    closedCount = dashRes.data.metrics.closedCount;
    totalCount = dashRes.data.metrics.totalOpportunities;
    selectedCandidatesCount = dashRes.data.metrics.selectedCandidatesCount;
    activePlacementsCount = dashRes.data.metrics.activePlacementsCount;
  } catch (err) {
    opportunities = [];
  }

  return (
    <DashboardShell
      userRole="industry"
      userName={profile?.full_name || "Industry Partner"}
      userEmail={user.email || "partner@ayushindustry.org"}
      breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Industry Dashboard" }]}
    >
      <PageHeader
        eyebrow="Industry Portal"
        eyebrowColor="green"
        title={`Welcome, ${profile?.full_name || "Industry Partner"}`}
        description="Ayush enterprise collaboration, apprenticeship postings, and skill-based candidate discovery."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="default" className="gap-2">
              <Link href="/industry/opportunities/new">
                <PlusCircle className="w-4 h-4" />
                <span>Post Opportunity</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/profile">
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Role Confirmation & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card accent="green">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ayush-muted">Assigned Role</span>
              <Badge variant="herbal" dot>
                Partner
              </Badge>
            </div>
            <CardTitle className="text-xl">Industry / Enterprise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-ayush-muted leading-relaxed">
              Authorized partner representing Ayush healthcare, manufacturing, or R&D.
            </p>
          </CardContent>
        </Card>

        {/* Opportunities Metrics Card */}
        <Card accent="saffron">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ayush-muted">Opportunity Postings</span>
              <Badge variant="parchment">{totalCount} Total</Badge>
            </div>
            <CardTitle className="text-xl">Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-ayush-herbal/10 p-2 border border-ayush-herbal/20">
                <div className="text-lg font-heading font-bold text-ayush-herbal">{publishedCount}</div>
                <div className="text-[10px] text-ayush-muted uppercase tracking-wider">Published</div>
              </div>
              <div className="rounded-lg bg-ayush-gold/10 p-2 border border-ayush-gold/20">
                <div className="text-lg font-heading font-bold text-ayush-gold">{draftCount}</div>
                <div className="text-[10px] text-ayush-muted uppercase tracking-wider">Drafts</div>
              </div>
              <div className="rounded-lg bg-ayush-sand/50 p-2 border border-ayush-border/60">
                <div className="text-lg font-heading font-bold text-ayush-muted">{closedCount}</div>
                <div className="text-[10px] text-ayush-muted uppercase tracking-wider">Closed</div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <Button asChild size="sm" variant="ghost" className="text-xs h-7 px-2">
                <Link href="/industry/opportunities" className="gap-1">
                  <span>Manage All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="default" className="text-xs h-7 px-3 gap-1">
                <Link href="/industry/opportunities/new">
                  <PlusCircle className="w-3 h-3" />
                  <span>Post Opportunity</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card accent="green">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ayush-muted">Selected Candidates</span>
              <Badge variant="herbal">{activePlacementsCount} Tracking</Badge>
            </div>
            <CardTitle className="text-xl">Internship & Placement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-serif text-ayush-text">{selectedCandidatesCount}</span>
                <span className="text-xs text-ayush-muted ml-1.5">Candidates Selected</span>
              </div>
              <Button asChild size="sm" variant="default" className="text-xs h-7 px-3">
                <Link href="/industry/internship-placement">Manage Tracking</Link>
              </Button>
            </div>
            <p className="text-xs text-ayush-muted leading-relaxed">
              Track candidate onboarding, agreement acceptance, milestones, and completion certificates.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Opportunities / Action Area */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-ayush-dark">
              Industry Opportunity Management
            </h3>
            <p className="text-xs text-ayush-muted">
              Define project roles, specify required Ayush competencies, and publish for student matching.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/industry/opportunities">View Opportunity List</Link>
          </Button>
        </div>

        {opportunities && opportunities.length > 0 ? (
          <div className="divide-y divide-ayush-border/60">
            {opportunities.slice(0, 4).map((opp) => (
              <div key={opp.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-ayush-dark">{opp.title}</span>
                    <Badge
                      variant={
                        opp.status === "published"
                          ? "herbal"
                          : opp.status === "draft"
                          ? "parchment"
                          : "outline"
                      }
                      className="capitalize text-[10px]"
                    >
                      {opp.status}
                    </Badge>
                    <span className="text-xs text-ayush-muted uppercase tracking-wider">
                      {opp.opportunity_type?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-ayush-muted mt-0.5">
                    {opp.application_deadline ? `Deadline: ${opp.application_deadline}` : "No deadline set"}
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost" className="text-xs">
                  <Link href="/industry/opportunities">View Details</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ayush-sand/80 text-ayush-brown border border-ayush-border/70">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="font-heading text-base font-semibold text-ayush-dark">
                No Opportunities Posted Yet
              </h4>
              <p className="text-xs text-ayush-muted leading-relaxed">
                Post your first Ayush internship, research project, or entry-level role with specific required competencies.
              </p>
            </div>
            <Button asChild size="sm" variant="default" className="gap-2">
              <Link href="/industry/opportunities/new">
                <PlusCircle className="w-4 h-4" />
                <span>Post Your First Opportunity</span>
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}

export default function IndustryDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Industry Portal...
          </div>
        </div>
      }
    >
      <IndustryDashboardContent />
    </Suspense>
  );
}
