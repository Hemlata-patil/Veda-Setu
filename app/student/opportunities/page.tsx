import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
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
import {
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Award,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Industry Opportunities — VEDA SETU",
  description: "Explore clinical internships, projects, and apprenticeships matched with your Ayush skill profile",
};

async function StudentOpportunitiesContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let opportunitiesWithMatch: any[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        results: number;
        data: {
          opportunities: Array<{
            id: string;
            title: string;
            description: string;
            opportunity_type: string;
            location: string | null;
            work_mode: string | null;
            eligibility: string | null;
            application_deadline: string | null;
            status: string;
            created_at: string;
            organization_name?: string | null;
            requirements: OpportunityCompetencyRequirement[];
            matchResult: any;
            hasApplied?: boolean;
          }>;
        };
      }>("/opportunities", {
        headers: { Cookie: `auth_token=${token}` },
      });

      const opps = res?.data?.opportunities || [];
      opportunitiesWithMatch = opps.map((opp) => ({
        ...opp,
        organizations: {
          name: opp.organization_name || "Ayush Partner Organization",
        },
      }));
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      opportunitiesWithMatch = [];
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
        { label: "Opportunities" },
      ]}
    >
      <PageHeader
        eyebrow="Industry & Academia"
        eyebrowColor="saffron"
        title="Industry Opportunities"
        description="Discover clinical internships, research collaborations, and entry-level roles with automated Skill Matching based on your assessed competencies."
      />

      {/* Info notice explaining Skill Match */}
      <div className="mb-6 rounded-xl border border-ayush-border/80 bg-ayush-card p-4 text-xs text-ayush-muted flex items-start gap-3 shadow-sm">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ayush-herbal/10 text-ayush-herbal">
          <Award className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-semibold text-ayush-dark">Transparent Skill Matching</p>
          <p className="leading-relaxed">
            Your <strong>Skill Match</strong> is calculated by comparing your verified competency assessment scores against each opportunity&apos;s required benchmarks. Unassessed competencies are marked as &ldquo;Not Assessed&rdquo; and do not contribute to requirement completion.
          </p>
        </div>
      </div>

      {opportunitiesWithMatch.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {opportunitiesWithMatch.map((opp) => {
            const orgName = opp.organizations?.name || "Ayush Partner Organization";
            const match = opp.matchResult;
            const matchPercentage = match.skillMatchPercentage;

            return (
              <Card
                key={opp.id}
                className="p-6 hover:border-ayush-border/90 transition-all shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left content area */}
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="herbal" className="text-[10px] capitalize">
                          {opp.opportunity_type?.replace(/_/g, " ")}
                        </Badge>
                        {opp.work_mode && (
                          <Badge variant="parchment" className="text-[10px] capitalize">
                            {opp.work_mode}
                          </Badge>
                        )}
                        <span className="text-xs text-ayush-muted flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-ayush-brown/60" />
                          {orgName}
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-ayush-dark pt-0.5">
                        {opp.title}
                      </h3>
                    </div>

                    <p className="text-xs text-ayush-muted line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-ayush-muted pt-1">
                      {opp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-ayush-brown/70" />
                          {opp.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ayush-brown/70" />
                        {opp.application_deadline
                          ? `Deadline: ${opp.application_deadline}`
                          : "No deadline specified"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-ayush-gold" />
                        {opp.requirements.length > 0
                          ? `${opp.requirements.length} Required ${opp.requirements.length === 1 ? "Competency" : "Competencies"}`
                          : "Skills not specified"}
                      </span>
                    </div>

                    {/* Competency tags preview */}
                    {opp.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {opp.requirements.slice(0, 4).map((r: any) => (
                          <span
                            key={r.competencyId}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-ayush-sand/50 text-ayush-dark border border-ayush-border/50"
                          >
                            {r.competencyName} (Min: {r.requiredScore})
                          </span>
                        ))}
                        {opp.requirements.length > 4 && (
                          <span className="text-[11px] text-ayush-muted self-center">
                            +{opp.requirements.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Match Score Card & Action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-4 shrink-0 lg:min-w-[200px] border-t lg:border-t-0 pt-4 lg:pt-0 border-ayush-border/60">
                    <div className="w-full sm:w-auto lg:w-full text-left lg:text-right">
                      {match.hasRequirements && matchPercentage !== null ? (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline lg:justify-end gap-1.5">
                            <span className="text-xs font-semibold text-ayush-muted uppercase tracking-wider">
                              Skill Match:
                            </span>
                            <span className="font-heading text-2xl font-bold text-ayush-herbal">
                              {matchPercentage}%
                            </span>
                          </div>
                          <div className="w-full lg:w-36 lg:ml-auto">
                            <Progress value={matchPercentage} className="h-1.5" />
                          </div>
                          <p className="text-[10px] text-ayush-muted">
                            {match.metCount} of {match.totalRequirementsCount} requirements met
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="parchment" className="text-[11px]">
                            Skills not specified
                          </Badge>
                          <p className="text-[10px] text-ayush-muted">General qualification</p>
                        </div>
                      )}
                    </div>

                    <Button asChild size="sm" variant="default" className="w-full sm:w-auto gap-2">
                      <Link href={`/student/opportunities/${opp.id}`}>
                        <span>View Opportunity</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
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
                No Opportunities Available
              </h3>
              <p className="text-xs text-ayush-muted leading-relaxed">
                There are currently no active published opportunities. Industry partners frequently post clinical internships, research fellowships, and live projects.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/student/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}

export default function StudentOpportunitiesPage() {
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
      <StudentOpportunitiesContent />
    </Suspense>
  );
}
