import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  calculateOpportunitySkillMatch,
  OpportunityCompetencyRequirement,
} from "@/lib/opportunities";
import { APPLICATION_STATUS_CONFIG, ApplicationStatus } from "@/lib/applications";
import {
  Users,
  Building2,
  Calendar,
  Award,
  ArrowRight,
  Eye,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CandidateStatusActions } from "./candidate-status-actions";

export const metadata = {
  title: "Candidate Applications — VEDA SETU",
  description: "Review and evaluate applicant skill profiles for your posted opportunities",
};

async function IndustryApplicationsContent() {
  const { user, profile } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let processedApplications: any[] = [];

  try {
    const appsRes = await apiFetch<{
      status: string;
      data: {
        applications: Array<any>;
      };
    }>("/industry/applications", {
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    });

    processedApplications = (appsRes.data.applications || []).map((app: any) => ({
      ...app,
      applied_at: app.appliedAt || app.applied_at,
      cover_note: app.coverNote !== undefined ? app.coverNote : app.cover_note,
      studentProfile: app.studentProfile || {
        full_name: app.studentName || "Ayush Candidate",
        institutions: app.institutionName ? { name: app.institutionName } : null,
      },
      opportunity: app.opportunity || {
        id: app.opportunityId,
        title: app.opportunityTitle,
        opportunity_type: app.opportunityType,
      },
      matchResult: app.matchResult,
    }));
  } catch (err) {
    processedApplications = [];
  }

  return (
    <DashboardShell
      userRole="industry"
      userName={profile?.full_name || "Industry Partner"}
      userEmail={user.email || "partner@ayushindustry.org"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Industry Dashboard", href: "/industry/dashboard" },
        { label: "Applications / Candidates" },
      ]}
    >
      <PageHeader
        eyebrow="Talent Discovery"
        eyebrowColor="green"
        title="Candidate Applications"
        description="Review applicants, evaluate real-time skill matching against requirements, and manage the candidate pipeline."
      />

      {processedApplications.length > 0 ? (
        <div className="space-y-4">
          {processedApplications.map((app) => {
            const opp = app.opportunity;
            const student = app.studentProfile;
            const studentName = student?.full_name || "Ayush Candidate";
            const institutionName =
              student?.institutions?.name || "Ayush Educational Institution";
            const statusConfig =
              APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus] || {
                label: app.status,
                variant: "parchment",
                description: "",
              };
            const matchPercentage = app.matchResult.skillMatchPercentage;
            const formattedDate = new Date(app.applied_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Card key={app.id} className="p-5 hover:border-ayush-border/90 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Candidate and Opportunity details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-bold text-ayush-dark">
                        {studentName}
                      </h3>
                      <Badge
                        variant={statusConfig.variant as any}
                        className="capitalize text-[11px]"
                      >
                        {statusConfig.label}
                      </Badge>
                      <span className="text-xs text-ayush-muted flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-ayush-brown/60" />
                        {institutionName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-ayush-dark">
                      <span className="font-medium">Applied for:</span>
                      <span className="text-ayush-herbal font-semibold">{opp.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {opp.opportunity_type?.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {app.cover_note && (
                      <p className="text-xs text-ayush-muted bg-ayush-sand/30 p-2 rounded-lg border border-ayush-border/50 line-clamp-1 italic">
                        &ldquo;{app.cover_note}&rdquo;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ayush-muted pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ayush-brown/70" />
                        Applied on {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Right side: Match score & Status actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-3 shrink-0 lg:min-w-[240px] border-t lg:border-t-0 pt-3 lg:pt-0 border-ayush-border/60">
                    <div className="text-left lg:text-right">
                      {app.matchResult.hasRequirements && matchPercentage !== null ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline lg:justify-end gap-1.5">
                            <span className="text-xs font-semibold text-ayush-muted uppercase tracking-wider">
                              Skill Match:
                            </span>
                            <span className="font-heading text-xl font-bold text-ayush-herbal">
                              {matchPercentage}%
                            </span>
                          </div>
                          <div className="w-28 lg:ml-auto">
                            <Progress value={matchPercentage} className="h-1.5" />
                          </div>
                          <p className="text-[10px] text-ayush-muted">
                            {app.matchResult.metCount} of {app.matchResult.totalRequirementsCount} met
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-ayush-muted">Skills not specified</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <CandidateStatusActions
                        applicationId={app.id}
                        currentStatus={app.status as ApplicationStatus}
                        showDetailLink={true}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ayush-sand/80 text-ayush-brown border border-ayush-border/70">
              <Users className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-heading text-xl font-semibold text-ayush-dark">
                No Candidate Applications Yet
              </h3>
              <p className="text-xs text-ayush-muted leading-relaxed">
                When students apply to your published opportunities, their evaluated competencies and transparent skill matches will appear here for review.
              </p>
            </div>
            <Button asChild size="sm" variant="default">
              <Link href="/industry/opportunities">Manage Opportunities</Link>
            </Button>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}

export default function IndustryApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Candidates...
          </div>
        </div>
      }
    >
      <IndustryApplicationsContent />
    </Suspense>
  );
}
