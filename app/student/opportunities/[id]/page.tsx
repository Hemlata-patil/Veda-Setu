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
  OpportunitySkillMatchResult,
  OPPORTUNITY_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/opportunities";
import {
  Building2,
  Calendar,
  MapPin,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Briefcase,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplyOpportunityCard } from "./apply-opportunity-card";

export const metadata = {
  title: "Opportunity Details — VEDA SETU",
  description: "Detailed competency evaluation and skill gap analysis for Ayush opportunity",
};

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

async function OpportunityDetailContent(props: OpportunityDetailPageProps) {
  const { id } = await props.params;
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let opportunity: any = null;
  let existingApplication: any = null;
  let requirements: OpportunityCompetencyRequirement[] = [];
  let matchResult: OpportunitySkillMatchResult = {
    hasRequirements: false,
    skillMatchPercentage: null,
    totalRequirementsCount: 0,
    metCount: 0,
    details: [],
    skillGaps: [],
  };
  let orgName = "Ayush Partner Organization";

  if (token) {
    let res: {
      status: string;
      data: {
        opportunity: any;
      };
    };
    try {
      res = await api.get<{
        status: string;
        data: {
          opportunity: any;
        };
      }>(`/opportunities/${id}`, {
        headers: { Cookie: `auth_token=${token}` },
      });
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        notFound();
      }
      throw err;
    }

    if (!res?.data?.opportunity) {
      notFound();
    }

    const opp = res.data.opportunity;
    opportunity = opp;
    orgName = opp.organization_name || "Ayush Partner Organization";
    requirements = opp.requirements || [];
    matchResult = opp.matchResult;
    existingApplication = opp.application || null;
  } else {
    notFound();
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "scholar@ayush.gov.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "Opportunities", href: "/student/opportunities" },
        { label: opportunity.title },
      ]}
    >
      <div className="mb-4">
        <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs text-ayush-muted">
          <Link href="/student/opportunities">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Opportunities</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Opportunity Analysis"
        eyebrowColor="saffron"
        title={opportunity.title}
        description={`Offered by ${orgName}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2-Column Info & Competency Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Overview Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="herbal" className="capitalize text-xs">
                {opportunity.opportunity_type?.replace(/_/g, " ")}
              </Badge>
              {opportunity.work_mode && (
                <Badge variant="parchment" className="capitalize text-xs">
                  {opportunity.work_mode}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                Description
              </h3>
              <p className="text-sm text-ayush-dark leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>

            {opportunity.eligibility && (
              <div className="space-y-1 pt-2 border-t border-ayush-border/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                  Eligibility Criteria
                </h3>
                <p className="text-sm text-ayush-dark leading-relaxed">
                  {opportunity.eligibility}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-ayush-border/60 text-xs">
              <div>
                <span className="text-ayush-muted block">Organization</span>
                <span className="font-medium text-ayush-dark flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-ayush-brown/70" />
                  {orgName}
                </span>
              </div>
              <div>
                <span className="text-ayush-muted block">Location / Work Mode</span>
                <span className="font-medium text-ayush-dark flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-ayush-brown/70" />
                  {opportunity.location || "Location not specified"} ({opportunity.work_mode || "onsite"})
                </span>
              </div>
              <div>
                <span className="text-ayush-muted block">Application Deadline</span>
                <span className="font-medium text-ayush-dark flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-ayush-brown/70" />
                  {opportunity.application_deadline || "No deadline set"}
                </span>
              </div>
            </div>
          </Card>

          {/* Required Competencies Breakdown (Part 5) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-ayush-dark">
                  Required Competencies
                </h3>
                <p className="text-xs text-ayush-muted">
                  Comparison between the opportunity&apos;s benchmarks and your verified assessment score.
                </p>
              </div>
              <Badge variant="parchment">
                {matchResult.totalRequirementsCount} Requirements
              </Badge>
            </div>

            {matchResult.hasRequirements ? (
              <div className="divide-y divide-ayush-border/60">
                {matchResult.details.map((item) => {
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
                          <span className="text-ayush-muted block">Your Score:</span>
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

          {/* Skill Gaps for This Opportunity (Part 5) */}
          {matchResult.hasRequirements && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-ayush-dark">
                    Skill Gaps for This Opportunity
                  </h3>
                  <p className="text-xs text-ayush-muted">
                    Industry-specific competency gaps where further development or assessment is needed.
                  </p>
                </div>
                <Badge variant={matchResult.skillGaps.length === 0 ? "herbal" : "saffron"}>
                  {matchResult.skillGaps.length === 0
                    ? "All Requirements Met"
                    : `${matchResult.skillGaps.length} Gaps Identified`}
                </Badge>
              </div>

              {matchResult.skillGaps.length > 0 ? (
                <div className="divide-y divide-ayush-border/60">
                  {matchResult.skillGaps.map((gapItem) => (
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
                            ? `Current score is below the industry requirement.`
                            : `Competency has not been evaluated in your assessment.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono bg-ayush-card px-3 py-1.5 rounded-lg border border-ayush-border shrink-0">
                        <div>
                          <span className="text-ayush-muted mr-1 font-sans">Required:</span>
                          <span className="font-bold text-ayush-dark">{gapItem.requiredScore}</span>
                        </div>
                        <div>
                          <span className="text-ayush-muted mr-1 font-sans">Your:</span>
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
                    Outstanding! You meet or exceed all required competency benchmarks for this opportunity.
                  </span>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Sidebar: Skill Match Gauge & Context */}
        <div className="space-y-6">
          <Card accent="saffron" className="p-6 space-y-5">
            <div className="space-y-1 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                Opportunity Evaluation
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
                    <span>Skill Gaps:</span>
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
                  This opportunity has general qualifications and does not specify minimum competency thresholds.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-ayush-border/60">
              <div className="rounded-lg bg-ayush-card p-3 text-[11px] text-ayush-muted leading-relaxed border border-ayush-border/70">
                <strong>Platform-defined matching algorithm:</strong> Skill Match evaluates verified academic & clinical competencies against industry requirements. It is an objective diagnostic tool for talent discovery.
              </div>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href="/student/skill-profile">
                  View Full Skill Profile
                </Link>
              </Button>
            </div>
          </Card>

          {/* Student Application Submission / Status Card */}
          <ApplyOpportunityCard
            opportunityId={opportunity.id}
            existingApplication={existingApplication}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

export default function OpportunityDetailPage(props: OpportunityDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Opportunity Details...
          </div>
        </div>
      }
    >
      <OpportunityDetailContent {...props} />
    </Suspense>
  );
}
