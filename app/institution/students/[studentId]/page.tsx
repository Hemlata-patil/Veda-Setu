import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_CONFIG, CompetencyCategory } from "@/lib/competencies";
import {
  User,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "Student Academic & Skill Profile — Institution Oversight — VEDA SETU",
  description: "Collegiate oversight of student clinical competencies, academic growth, and mentorship status",
};

interface InstitutionStudentDetailPageProps {
  params: Promise<{ studentId: string }>;
}

interface ExpressStudentDetail {
  student: {
    id: string;
    fullName: string;
    email: string;
    program: string | null;
    year: number | null;
    department: string | null;
    institutionName: string | null;
    institutionCode: string | null;
    createdAt: string;
  };
  competencies: Array<{
    competency_id: string;
    proficiency_score: number;
    last_assessed_at: string | null;
    source: string | null;
    verified: boolean;
    name: string;
    category: string;
    description: string | null;
  }>;
  applicationCounts: {
    total: number;
    applied: number;
    underReview: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    withdrawn: number;
  };
  mentorship: {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    mentorName: string;
  } | null;
}

function buildSkillProfileFromComps(comps: ExpressStudentDetail["competencies"]) {
  if (comps.length === 0) {
    return {
      hasCompletedAssessment: false,
      overallScore: 0,
      lastAssessedAt: null,
      categorySummaries: {
        academic_domain: { score: 0, competencyCount: 0 },
        clinical_practical: { score: 0, competencyCount: 0 },
        research: { score: 0, competencyCount: 0 },
        professional: { score: 0, competencyCount: 0 },
      } as Record<CompetencyCategory, { score: number; competencyCount: number }>,
      priorityDevelopmentAreas: [] as Array<{ id: string; name: string; description: string | null; score: number }>,
      competencies: [] as Array<{ id: string; name: string; category: CompetencyCategory; score: number; verified: boolean }>,
    };
  }

  const catAccum: Record<string, { sum: number; count: number }> = {};
  let totalSum = 0;
  let lastAssessedAt: string | null = null;

  const competencies = comps.map((c) => {
    totalSum += c.proficiency_score;
    if (!catAccum[c.category]) catAccum[c.category] = { sum: 0, count: 0 };
    catAccum[c.category].sum += c.proficiency_score;
    catAccum[c.category].count += 1;
    if (c.last_assessed_at && (!lastAssessedAt || c.last_assessed_at > lastAssessedAt)) {
      lastAssessedAt = c.last_assessed_at;
    }
    return {
      id: c.competency_id,
      name: c.name,
      category: c.category as CompetencyCategory,
      score: Math.round(c.proficiency_score),
      verified: c.verified,
    };
  });

  const overallScore = Math.round(totalSum / comps.length);

  const categorySummaries: Record<CompetencyCategory, { score: number; competencyCount: number }> = {
    academic_domain: { score: 0, competencyCount: 0 },
    clinical_practical: { score: 0, competencyCount: 0 },
    research: { score: 0, competencyCount: 0 },
    professional: { score: 0, competencyCount: 0 },
  };

  for (const [cat, acc] of Object.entries(catAccum)) {
    if (categorySummaries[cat as CompetencyCategory] !== undefined) {
      categorySummaries[cat as CompetencyCategory] = {
        score: Math.round(acc.sum / acc.count),
        competencyCount: acc.count,
      };
    }
  }

  const priorityDevelopmentAreas = competencies
    .filter((c) => c.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: comps.find((x) => x.competency_id === c.id)?.description ?? null,
      score: c.score,
    }));

  return {
    hasCompletedAssessment: true,
    overallScore,
    lastAssessedAt,
    categorySummaries,
    priorityDevelopmentAreas,
    competencies,
  };
}

async function InstitutionStudentDetailContent({ params }: InstitutionStudentDetailPageProps) {
  const { studentId } = await params;
  const { user, profile: institutionProfile } = await requireRole("institution");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    notFound();
  }

  let detail: ExpressStudentDetail | null = null;

  try {
    const res = await apiFetch<{ status: string; data: ExpressStudentDetail }>(
      `/institution/students/${studentId}`,
      { headers: { Cookie: `auth_token=${token}` } }
    );
    detail = res.data;
  } catch (err: any) {
    // 403 = cross-tenant access or not affiliated; 404 = student not found
    notFound();
  }

  if (!detail) notFound();

  const { student, competencies, applicationCounts, mentorship } = detail;
  const skillProfile = buildSkillProfileFromComps(competencies);

    return (
      <DashboardShell
        userRole="institution"
        userName={institutionProfile?.full_name || "Institution Administrator"}
        userEmail={user.email || "admin@institution.edu.in"}
        breadcrumbs={[
          { label: "Ayush Portal", href: "/" },
          { label: "Institution Dashboard", href: "/institution/dashboard" },
          { label: "Students", href: "/institution/students" },
          { label: student.fullName || "Student Profile" },
        ]}
      >
        {/* Back button */}
        <div className="mb-4">
          <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs text-ayush-muted">
            <Link href="/institution/students">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Enrolled Students Directory</span>
            </Link>
          </Button>
        </div>

        <PageHeader
          eyebrow="Collegiate Academic Oversight"
          eyebrowColor="brown"
          title={student.fullName || "Ayush Student"}
          description="Standardized competency profile, curricular benchmarks, and clinical supervision."
          actions={
            <div className="flex items-center gap-2">
              {skillProfile.hasCompletedAssessment ? (
                <Badge variant="herbal">Assessment Completed</Badge>
              ) : (
                <Badge variant="parchment">Assessment Pending</Badge>
              )}
              {mentorship?.status === "active" && <Badge variant="saffron" dot>Active Mentorship</Badge>}
              {mentorship?.status === "completed" && <Badge variant="herbal">Mentorship Completed</Badge>}
            </div>
          }
        />

        {/* Student Academic Identity Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-lg bg-ayush-surface-raised border border-ayush-border/60 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ayush-surface flex items-center justify-center border border-ayush-border text-ayush-muted">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-ayush-text text-sm">{student.fullName || "Ayush Student"}</p>
              <p className="text-ayush-muted flex items-center gap-1.5 mt-0.5">
                <span>{student.program || "BAMS"}</span>
                <span>&bull;</span>
                <span>{student.year ? `Year ${student.year}` : "Enrolled"}</span>
                <span>&bull;</span>
                <span>{student.department || "Ayurveda Samhita & Siddhanta"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-ayush-muted">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{student.institutionName || "Affiliated Campus"}</span>
            </div>
            {skillProfile.lastAssessedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Assessed: {new Date(skillProfile.lastAssessedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Skill Profile & Competencies */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <Card accent="saffron" className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ayush-muted font-medium">Platform Skill Profile</span>
                  <Badge variant={skillProfile.hasCompletedAssessment ? "saffron" : "parchment"}>
                    {skillProfile.hasCompletedAssessment ? "Verified Evaluation" : "Not Yet Assessed"}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl font-extrabold text-ayush-text">
                    {skillProfile.hasCompletedAssessment ? `${skillProfile.overallScore}%` : "—"}
                  </span>
                  <span className="text-xs text-ayush-muted">Composite proficiency across NCISM-aligned competency domains</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-ayush-surface rounded-full h-2 overflow-hidden border border-ayush-border/40">
                  <div className="bg-ayush-saffron h-full transition-all duration-500 rounded-full" style={{ width: `${skillProfile.overallScore}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* 4 Category Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(CATEGORY_CONFIG) as CompetencyCategory[]).map((catKey) => {
                const catSummary = skillProfile.categorySummaries[catKey];
                const config = CATEGORY_CONFIG[catKey];
                return (
                  <Card key={catKey}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-ayush-muted">{config.shortLabel}</span>
                        <Badge variant={config.badgeVariant}>{catSummary.competencyCount} Competencies</Badge>
                      </div>
                      <CardTitle className="text-xl font-bold">
                        {catSummary.competencyCount > 0 ? `${catSummary.score}%` : "—"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-ayush-surface rounded-full h-1.5 overflow-hidden border border-ayush-border/30 mb-2">
                        <div className="bg-ayush-green h-full rounded-full transition-all" style={{ width: `${catSummary.score}%` }} />
                      </div>
                      <p className="text-[11px] text-ayush-muted line-clamp-2">{config.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Priority Development Areas */}
            {skillProfile.priorityDevelopmentAreas.length > 0 && (
              <Card accent="green">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-ayush-saffron" />
                    <span>Platform Development Indicators</span>
                  </CardTitle>
                  <p className="text-xs text-ayush-muted">Competencies with lower evaluation scores where faculty coaching and clinical remediation deliver the highest academic impact.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skillProfile.priorityDevelopmentAreas.map((area) => (
                    <div key={area.id} className="p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-ayush-text">{area.name}</p>
                        <p className="text-[11px] text-ayush-muted mt-0.5">{area.description}</p>
                      </div>
                      <span className="text-xs font-bold text-ayush-saffron px-2 py-0.5 rounded bg-ayush-surface border border-ayush-border shrink-0">{area.score}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Detailed Competency List */}
            {skillProfile.competencies.length > 0 && (
              <Card>
                <CardHeader className="pb-3 border-b border-ayush-border/40">
                  <CardTitle className="text-base">All Evaluated Competencies</CardTitle>
                  <p className="text-xs text-ayush-muted">Official clinical, diagnostic, and research competency scores recorded for this scholar.</p>
                </CardHeader>
                <CardContent className="pt-3 divide-y divide-ayush-border/40">
                  {skillProfile.competencies.map((comp) => (
                    <div key={comp.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-medium text-ayush-text">{comp.name}</span>
                        <span className="text-ayush-muted ml-2 text-[11px]">({CATEGORY_CONFIG[comp.category]?.shortLabel || comp.category})</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-ayush-text">{comp.score}%</span>
                        {comp.verified && <CheckCircle2 className="w-3.5 h-3.5 text-ayush-green" />}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Mentorship Status & Application Funnel */}
          <div className="space-y-6">
            {/* Mentorship Status Card */}
            <Card accent="brown">
              <CardHeader className="pb-3 border-b border-ayush-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-ayush-brown" />
                    <span>Academic Mentorship</span>
                  </CardTitle>
                  {mentorship?.status === "active" && <Badge variant="saffron" dot>Active</Badge>}
                  {mentorship?.status === "completed" && <Badge variant="herbal">Completed</Badge>}
                  {!mentorship && <Badge variant="default">Not Mentored</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                {mentorship ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-ayush-muted">Assigned Faculty Mentor:</span>
                      <strong className="text-ayush-text">{mentorship.mentorName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ayush-muted">Status:</span>
                      <span className="capitalize font-medium text-ayush-text">{mentorship.status} Mentorship</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ayush-muted pt-2 border-t border-ayush-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last Interaction:
                      </span>
                      <span>{new Date(mentorship.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-ayush-muted italic pt-1">Guidance notes remain private between the student and faculty mentor.</p>
                  </>
                ) : (
                  <p className="text-ayush-muted">No 1-on-1 faculty mentorship relationship has been initiated for this student yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Application Outcomes Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-ayush-border/40">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-ayush-muted" />
                  <span>Industry Application Outcomes</span>
                </CardTitle>
                <p className="text-xs text-ayush-muted mt-0.5">Aggregate industry apprenticeship &amp; placement activity</p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 text-xs">
                  <span className="text-ayush-muted">Total Applications Submitted:</span>
                  <strong className="text-ayush-text">{applicationCounts.total}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-ayush-surface border border-ayush-border">
                    <span className="text-ayush-muted block text-[11px]">Under Review</span>
                    <strong className="text-ayush-text text-sm">{applicationCounts.underReview}</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-ayush-surface border border-ayush-border">
                    <span className="text-ayush-muted block text-[11px]">Shortlisted</span>
                    <strong className="text-ayush-saffron text-sm">{applicationCounts.shortlisted}</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-ayush-surface border border-ayush-border">
                    <span className="text-ayush-muted block text-[11px]">Selected</span>
                    <strong className="text-ayush-green text-sm">{applicationCounts.selected}</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-ayush-surface border border-ayush-border">
                    <span className="text-ayush-muted block text-[11px]">Rejected / Closed</span>
                    <strong className="text-ayush-muted text-sm">{applicationCounts.rejected}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-ayush-muted italic pt-1">Student cover notes and proposal specifics are confidential to the candidate and hiring partner.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
  );
}

export default function InstitutionStudentDetailPage(props: InstitutionStudentDetailPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Student Profile...</div>}>
      <InstitutionStudentDetailContent {...props} />
    </Suspense>
  );
}
