import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
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
  Building2,
  Calendar,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  GraduationCap,
  Briefcase,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CandidateStatusActions } from "../candidate-status-actions";

export const metadata = {
  title: "Candidate Review — VEDA SETU",
  description: "Candidate skill evaluation and opportunity requirement breakdown",
};

interface CandidateDetailPageProps {
  params: Promise<{ applicationId: string }>;
}

async function CandidateDetailContent(props: CandidateDetailPageProps) {
  const { applicationId } = await props.params;
  const { user, profile } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let application: any = null;
  let opp: any = null;
  let student: any = null;
  let matchResult: any = null;

  let candidateRes: any;
  try {
    candidateRes = await apiFetch<{
      status: string;
      data: { candidate: any };
    }>(`/industry/applications/${applicationId}`, {
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    });
  } catch {
    notFound();
  }

  const c = candidateRes?.data?.candidate;
  if (!c) {
    notFound();
  }

  application = {
    id: c.id,
    status: c.status,
    applied_at: c.appliedAt || c.applied_at,
    cover_note: c.coverNote !== undefined ? c.coverNote : c.cover_note,
    student_id: c.studentId,
  };
  opp = c.opportunity || {
    id: c.opportunityId,
    title: c.opportunityTitle,
    opportunity_type: c.opportunityType,
    location: c.location,
    work_mode: c.workMode,
    created_by: user.id,
  };
  student = c.studentProfile || {
    id: c.studentId,
    full_name: c.studentName || "Ayush Candidate",
    program: c.studentProgram,
    year: c.studentYear,
    institutions: c.institutionName ? { name: c.institutionName } : null,
  };
  matchResult = c.matchResult;

  const studentName = student?.full_name || "Ayush Candidate";
  const institutionName = student?.institutions?.name || "Ayush Institution";
  const statusConfig =
    APPLICATION_STATUS_CONFIG[application.status as ApplicationStatus] || {
      label: application.status,
      variant: "parchment",
      description: "",
    };

  return (
    <DashboardShell
      userRole="industry"
      userName={profile?.full_name || "Industry Partner"}
      userEmail={user.email || "partner@ayushindustry.org"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Industry Dashboard", href: "/industry/dashboard" },
        { label: "Applications", href: "/industry/applications" },
        { label: studentName },
      ]}
    >
      <div className="mb-4">
        <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs text-ayush-muted">
          <Link href="/industry/applications">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Candidates</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Candidate Review"
        eyebrowColor="green"
        title={studentName}
        description={`Applicant for ${opp.title}`}
        actions={
          <CandidateStatusActions
            applicationId={application.id}
            currentStatus={application.status as ApplicationStatus}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Candidate Info, Required Competencies, Skill Gaps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Profile Summary Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig.variant as any} className="text-xs capitalize font-semibold">
                  Status: {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {opp.opportunity_type?.replace(/_/g, " ")}
                </Badge>
              </div>
              <span className="text-xs text-ayush-muted">
                Applied on {new Date(application.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <span className="text-ayush-muted block">Academic Institution</span>
                <span className="font-medium text-ayush-dark flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-ayush-brown/70" />
                  {institutionName}
                </span>
              </div>
              <div>
                <span className="text-ayush-muted block">Degree Program & Year</span>
                <span className="font-medium text-ayush-dark mt-0.5 block">
                  {student?.program ? `${student.program} ${student.year ? `(Year ${student.year})` : ""}` : "BAMS Scholar"}
                </span>
              </div>
            </div>

            {application.cover_note && (
              <div className="pt-3 border-t border-ayush-border/60 space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                  Candidate Cover Note
                </h4>
                <p className="text-xs text-ayush-dark bg-ayush-sand/30 p-3 rounded-lg border border-ayush-border/50 leading-relaxed italic">
                  &ldquo;{application.cover_note}&rdquo;
                </p>
              </div>
            )}
          </Card>

          {/* Required Competency Evaluation Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-ayush-dark">
                  Competency Evaluation
                </h3>
                <p className="text-xs text-ayush-muted">
                  Required benchmarks for {opp.title} vs assessed candidate scores.
                </p>
              </div>
              <Badge variant="parchment">
                {matchResult.totalRequirementsCount} Requirements
              </Badge>
            </div>

            {matchResult.hasRequirements ? (
              <div className="divide-y divide-ayush-border/60">
                {matchResult.details.map((item: any) => {
                  let statusBadge = null;
                  if (item.status === "Met") {
                    statusBadge = (
                      <Badge variant="herbal" className="text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Met
                      </Badge>
                    );
                  } else if (item.status === "Development Needed") {
                    statusBadge = (
                      <Badge variant="saffron" className="text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Development Needed
                      </Badge>
                    );
                  } else {
                    statusBadge = (
                      <Badge variant="parchment" className="text-xs flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Not Assessed
                      </Badge>
                    );
                  }

                  return (
                    <div key={item.competencyId} className="py-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-sm text-ayush-dark">
                            {item.competencyName}
                          </span>
                          <span className="text-[11px] text-ayush-muted capitalize ml-2">
                            ({item.category?.replace(/_/g, " ")})
                          </span>
                        </div>
                        <div>{statusBadge}</div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-ayush-sand/30 p-2.5 rounded-lg border border-ayush-border/50">
                        <div>
                          <span className="text-ayush-muted block">Required Score:</span>
                          <span className="font-semibold text-ayush-dark">{item.requiredScore} / 100</span>
                        </div>
                        <div>
                          <span className="text-ayush-muted block">Candidate Score:</span>
                          <span className="font-semibold text-ayush-dark">
                            {item.studentScore !== null ? `${item.studentScore} / 100` : "Not Assessed"}
                          </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-ayush-muted block">Status:</span>
                          <span className="font-medium text-ayush-dark">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-ayush-muted">
                Skills not specified for this opportunity.
              </div>
            )}
          </Card>

          {/* Skill Gaps for this Opportunity */}
          {matchResult.hasRequirements && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-ayush-dark">
                    Skill Gaps for This Opportunity
                  </h3>
                  <p className="text-xs text-ayush-muted">
                    Deficits where the candidate does not currently meet the required benchmark.
                  </p>
                </div>
                <Badge variant={matchResult.skillGaps.length === 0 ? "herbal" : "saffron"}>
                  {matchResult.skillGaps.length === 0
                    ? "Zero Skill Gaps"
                    : `${matchResult.skillGaps.length} Gaps`}
                </Badge>
              </div>

              {matchResult.skillGaps.length > 0 ? (
                <div className="divide-y divide-ayush-border/60">
                  {matchResult.skillGaps.map((gapItem: any) => (
                    <div
                      key={gapItem.competencyId}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm text-ayush-dark flex items-center gap-2">
                          <span>{gapItem.competencyName}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {gapItem.category?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-ayush-muted">
                          {gapItem.isAssessed
                            ? `Candidate is below the required benchmark.`
                            : `Candidate has not been evaluated on this competency.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono bg-ayush-card px-3 py-1.5 rounded-lg border border-ayush-border shrink-0">
                        <div>
                          <span className="text-ayush-muted mr-1 font-sans">Required:</span>
                          <span className="font-bold text-ayush-dark">{gapItem.requiredScore}</span>
                        </div>
                        <div>
                          <span className="text-ayush-muted mr-1 font-sans">Candidate:</span>
                          <span className="font-bold text-ayush-dark">
                            {gapItem.studentScore !== null ? gapItem.studentScore : "—"}
                          </span>
                        </div>
                        <div className="border-l border-ayush-border pl-3">
                          <span className="text-amber-800 font-bold">
                            Gap: {gapItem.gap}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-ayush-herbal/10 border border-ayush-herbal/20 p-4 text-xs text-ayush-herbal flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Candidate fully meets or exceeds all required competency benchmarks for this role.
                  </span>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right sidebar: Match Gauge & Workflow action card */}
        <div className="space-y-6">
          <Card accent="saffron" className="p-6 space-y-5">
            <div className="space-y-1 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                Match Evaluation
              </span>
              <h4 className="font-heading text-xl font-bold text-ayush-dark">
                Skill Match
              </h4>
            </div>

            {matchResult.hasRequirements && matchResult.skillMatchPercentage !== null ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-ayush-sand/30 border border-ayush-border/60">
                  <span className="font-heading text-5xl font-bold text-ayush-herbal">
                    {matchResult.skillMatchPercentage}%
                  </span>
                  <span className="text-xs text-ayush-muted mt-1">Platform Skill Match</span>
                  <div className="w-full mt-4">
                    <Progress value={matchResult.skillMatchPercentage} className="h-2" />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-ayush-muted">
                    <span>Requirements Met:</span>
                    <span className="font-semibold text-ayush-dark">
                      {matchResult.metCount} of {matchResult.totalRequirementsCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-ayush-muted">
                    <span>Identified Gaps:</span>
                    <span className="font-semibold text-amber-800">
                      {matchResult.skillGaps.length}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-ayush-sand/30 border border-ayush-border/60 space-y-2">
                <Badge variant="parchment" className="text-xs">
                  Skills not specified
                </Badge>
                <p className="text-xs text-ayush-muted leading-relaxed">
                  General qualification opportunity without specific competency thresholds.
                </p>
              </div>
            )}

            {/* Candidate pipeline management actions */}
            <div className="pt-4 border-t border-ayush-border/60 space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ayush-dark">
                Pipeline Management
              </h5>
              <div className="flex flex-col gap-2">
                <CandidateStatusActions
                  applicationId={application.id}
                  currentStatus={application.status as ApplicationStatus}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function CandidateDetailPage(props: CandidateDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Candidate Details...
          </div>
        </div>
      }
    >
      <CandidateDetailContent {...props} />
    </Suspense>
  );
}
