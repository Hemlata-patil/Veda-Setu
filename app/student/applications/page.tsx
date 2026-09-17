import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  calculateOpportunitySkillMatch,
  OpportunityCompetencyRequirement,
} from "@/lib/opportunities";
import { APPLICATION_STATUS_CONFIG, ApplicationStatus } from "@/lib/applications";
import {
  Briefcase,
  Building2,
  Calendar,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { WithdrawButton } from "./withdraw-button";

export const metadata = {
  title: "My Applications — VEDA SETU",
  description: "Track your submitted applications, recruitment review status, and skill matches",
};

async function StudentApplicationsContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let processedApplications: any[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        results: number;
        data: {
          applications: Array<{
            id: string;
            opportunityId: string;
            opportunityTitle: string;
            opportunityType: string;
            organizationName: string | null;
            location: string | null;
            workMode: string | null;
            status: string;
            coverNote: string | null;
            appliedAt: string;
            matchResult: any;
          }>;
        };
      }>("/students/me/applications", {
        headers: { Cookie: `auth_token=${token}` },
      });

      const apps = res?.data?.applications || [];
      processedApplications = apps.map((app) => ({
        id: app.id,
        status: app.status,
        applied_at: app.appliedAt,
        cover_note: app.coverNote,
        matchResult: app.matchResult,
        opportunity: {
          id: app.opportunityId,
          title: app.opportunityTitle,
          opportunity_type: app.opportunityType,
          location: app.location,
          work_mode: app.workMode,
          organizations: {
            name: app.organizationName,
          },
        },
      }));
    } catch (err) {
      console.error("Error fetching applications:", err);
      processedApplications = [];
    }
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "scholar@ayush.gov.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "My Applications" },
      ]}
    >
      <PageHeader
        eyebrow="Recruitment & Training"
        eyebrowColor="saffron"
        title="My Applications"
        description="Track the status of your clinical internships, research fellowships, and project applications."
      />

      {processedApplications.length > 0 ? (
        <div className="space-y-4">
          {processedApplications.map((app) => {
            const opp = app.opportunity;
            const orgName = opp.organizations?.name || "Ayush Partner Organization";
            const statusConfig =
              APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus] || {
                label: app.status,
                variant: "parchment",
                description: "",
              };
            const matchPercentage = app.matchResult.skillMatchPercentage;
            const canWithdraw = app.status === "applied" || app.status === "under_review";
            const formattedDate = new Date(app.applied_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Card key={app.id} className="p-6 hover:border-ayush-border/90 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left info area */}
                  <div className="space-y-2.5 flex-1">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={statusConfig.variant as any}
                          className="capitalize text-xs font-semibold"
                        >
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {opp.opportunity_type?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-ayush-muted flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-ayush-brown/60" />
                          {orgName}
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-ayush-dark pt-0.5">
                        {opp.title}
                      </h3>
                    </div>

                    {app.cover_note && (
                      <p className="text-xs text-ayush-muted bg-ayush-sand/30 p-2.5 rounded-lg border border-ayush-border/50 line-clamp-2 italic">
                        &ldquo;{app.cover_note}&rdquo;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ayush-muted pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ayush-brown/70" />
                        Applied on {formattedDate}
                      </span>
                      {opp.location && (
                        <span>
                          {opp.location} ({opp.work_mode || "onsite"})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Match & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-4 shrink-0 lg:min-w-[200px] border-t lg:border-t-0 pt-4 lg:pt-0 border-ayush-border/60">
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
                        </div>
                      ) : (
                        <span className="text-xs text-ayush-muted">Skills not specified</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canWithdraw && <WithdrawButton applicationId={app.id} />}
                      <Button asChild size="sm" variant="default" className="gap-1.5 text-xs">
                        <Link href={`/student/opportunities/${opp.id}`}>
                          <span>View Opportunity</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
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
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-heading text-xl font-semibold text-ayush-dark">
                No Applications Yet
              </h3>
              <p className="text-xs text-ayush-muted leading-relaxed">
                Explore published industry opportunities and submit your profile to match with top clinical institutions and enterprises.
              </p>
            </div>
            <Button asChild size="sm" variant="default">
              <Link href="/student/opportunities">Browse Opportunities</Link>
            </Button>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}

export default function StudentApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Applications...
          </div>
        </div>
      }
    >
      <StudentApplicationsContent />
    </Suspense>
  );
}
