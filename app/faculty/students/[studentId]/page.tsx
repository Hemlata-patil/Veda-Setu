import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildStudentSkillProfile, CATEGORY_CONFIG, CompetencyCategory } from "@/lib/competencies";
import { MentorshipCard } from "@/components/faculty/mentorship-card";
import {
  User,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "Student Skill Profile — Faculty Supervision — VEDA SETU",
  description: "View verified student competencies and guide academic mentorship",
};

interface StudentDetailPageProps {
  params: Promise<{ studentId: string }>;
}

async function StudentDetailContent({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  const { user, profile: facultyProfile } = await requireRole("faculty");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const headers = {
    Cookie: token ? `auth_token=${token}` : "",
    Authorization: token ? `Bearer ${token}` : "",
  };

  let detailRes: {
    status: string;
    data: {
      student: {
        id: string;
        fullName: string;
        email: string;
        program: string | null;
        year: number | null;
        department: string | null;
        institutionName: string | null;
        institutionCode: string | null;
        institutionLocation: string | null;
        createdAt: string;
      };
      competencies: Array<{
          competency_id: string;
          proficiency_score: number | string | null;
          last_assessed_at: string | null;
          source: string | null;
          verified: boolean | null;
          name: string;
          category: string;
          description: string | null;
        }>;
        placements: Array<{
          id: string;
          engagement_type: string;
          status: string;
          start_date: string | null;
          expected_end_date: string | null;
          actual_end_date: string | null;
          progress_percent: number | string | null;
          outcome: string | null;
          opportunity_title: string;
          organization_name: string | null;
        }>;
        mentorship: {
          id: string;
          status: "pending" | "active" | "completed" | "rejected";
          mentor_note: string | null;
          request_note?: string | null;
          created_at: string;
          updated_at: string;
        } | null;
      };
    };

    try {
      detailRes = await apiFetch(`/faculty/students/${studentId}`, { headers });
    } catch {
      notFound();
    }

    const detail = detailRes.data;
    const student = {
      id: detail.student.id,
      full_name: detail.student.fullName,
    };
    const institution = {
      name: detail.student.institutionName,
      state: detail.student.institutionLocation,
      code: detail.student.institutionCode,
    };

    const rawComps = (detail.competencies || []).map((c) => ({
      competency_id: c.competency_id,
      proficiency_score: c.proficiency_score,
      last_assessed_at: c.last_assessed_at,
      source: c.source,
      verified: c.verified,
      competencies: {
        id: c.competency_id,
        name: c.name,
        category: c.category,
        description: c.description,
      },
    }));

    const skillProfile = buildStudentSkillProfile(rawComps);
    const mentorship = detail.mentorship || null;

    const studentPlacements = (detail.placements || []).map((p) => ({
      ...p,
      opportunityTitle: p.opportunity_title || "Industry Opportunity",
      organizationName: p.organization_name,
    }));

    return (
      <DashboardShell
        userRole="faculty"
        userName={facultyProfile?.full_name || "Faculty Mentor"}
        userEmail={user.email || "faculty@institution.edu.in"}
        breadcrumbs={[
          { label: "Ayush Portal", href: "/" },
          { label: "Faculty Dashboard", href: "/faculty/dashboard" },
          { label: "My Students", href: "/faculty/students" },
          { label: student.full_name || "Student Profile" },
        ]}
      >
        {/* Back button */}
        <div className="mb-4">
          <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs text-ayush-muted">
            <Link href="/faculty/students">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Institution Cohort</span>
            </Link>
          </Button>
        </div>

        <PageHeader
          eyebrow="Student Skill Supervision"
          eyebrowColor="saffron"
          title={student.full_name || "Student Scholar"}
          description="Academic competency profile and institutional mentorship supervision."
          actions={
            <div className="flex items-center gap-2">
              {skillProfile.hasCompletedAssessment ? (
                <Badge variant="herbal">Assessment Completed</Badge>
              ) : (
                <Badge variant="parchment">Assessment Pending</Badge>
              )}
              {mentorship?.status === "pending" && (
                <Badge variant="saffron" dot>Pending Request</Badge>
              )}
              {mentorship?.status === "active" && (
                <Badge variant="saffron" dot>Active Mentee</Badge>
              )}
              {mentorship?.status === "completed" && (
                <Badge variant="herbal">Mentorship Completed</Badge>
              )}
            </div>
          }
        />

        {/* Student Overview Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-lg bg-ayush-surface-raised border border-ayush-border/60 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ayush-surface flex items-center justify-center border border-ayush-border text-ayush-muted">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-ayush-text text-sm">{student.full_name || "Ayush Scholar"}</p>
              <p className="text-ayush-muted flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{institution?.name || "Affiliated Campus"}</span>
                {institution?.state && <span>&bull; {institution.state}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-ayush-muted">
            {skillProfile.lastAssessedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Assessed: {new Date(skillProfile.lastAssessedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Grid: Left column (Skill Profile), Right column (Mentorship Action Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <Card accent="saffron" className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ayush-muted font-medium">Platform Skill Profile</span>
                  <Badge variant={skillProfile.hasCompletedAssessment ? "saffron" : "parchment"}>
                    {skillProfile.hasCompletedAssessment ? "Verified Evaluation" : "Not Yet Evaluated"}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-4xl font-extrabold text-ayush-text">
                    {skillProfile.hasCompletedAssessment ? `${skillProfile.overallScore}%` : "—"}
                  </span>
                  <span className="text-xs text-ayush-muted">
                    Composite proficiency across NCISM-mapped competency domains
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-ayush-surface rounded-full h-2 overflow-hidden border border-ayush-border/40">
                  <div
                    className="bg-ayush-saffron h-full transition-all duration-500 rounded-full"
                    style={{ width: `${skillProfile.overallScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 4 Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(CATEGORY_CONFIG) as CompetencyCategory[]).map((catKey) => {
                const catSummary = skillProfile.categorySummaries[catKey];
                const config = CATEGORY_CONFIG[catKey];

                return (
                  <Card key={catKey}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-ayush-muted">{config.shortLabel}</span>
                        <Badge variant={config.badgeVariant}>
                          {catSummary.competencyCount} Competencies
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold">
                        {catSummary.competencyCount > 0 ? `${catSummary.score}%` : "—"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-ayush-surface rounded-full h-1.5 overflow-hidden border border-ayush-border/30 mb-2">
                        <div
                          className="bg-ayush-green h-full rounded-full transition-all"
                          style={{ width: `${catSummary.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-ayush-muted line-clamp-2">
                        {config.description}
                      </p>
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
                    <span>Recommended Mentorship Focus Areas</span>
                  </CardTitle>
                  <p className="text-xs text-ayush-muted">
                    Competencies with lower evaluation scores where structured faculty guidance will deliver the highest impact.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skillProfile.priorityDevelopmentAreas.map((area) => (
                    <div
                      key={area.id}
                      className="p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs font-semibold text-ayush-text">{area.name}</p>
                        <p className="text-[11px] text-ayush-muted mt-0.5">{area.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-ayush-saffron px-2 py-0.5 rounded bg-ayush-surface border border-ayush-border">
                          {area.score}%
                        </span>
                      </div>
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
                  <p className="text-xs text-ayush-muted">
                    Full list of individual competency scores recorded for this scholar.
                  </p>
                </CardHeader>
                <CardContent className="pt-3 divide-y divide-ayush-border/40">
                  {skillProfile.competencies.map((comp) => (
                    <div key={comp.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-medium text-ayush-text">{comp.name}</span>
                        <span className="text-ayush-muted ml-2 text-[11px]">
                          ({CATEGORY_CONFIG[comp.category]?.shortLabel || comp.category})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-ayush-text">{comp.score}%</span>
                        {comp.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-ayush-green" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Mentorship Management Card */}
          <div className="space-y-6">
            <MentorshipCard
              studentId={student.id}
              studentName={student.full_name || "Scholar"}
              mentorship={mentorship}
            />

            {/* Internship & Placement Overview (Read-Only) */}
            <Card accent="saffron">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Internship & Placement</span>
                  <Badge variant="outline" className="text-[10px]">
                    {studentPlacements.length} {studentPlacements.length === 1 ? "Record" : "Records"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {studentPlacements.length === 0 ? (
                  <p className="text-ayush-text-muted italic">
                    No active internship or placement records initiated for this student yet.
                  </p>
                ) : (
                  studentPlacements.map((pl: any) => (
                    <div key={pl.id} className="p-3 rounded-lg bg-ayush-parchment/15 border border-ayush-parchment/30 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ayush-text truncate">
                          {pl.opportunityTitle}
                        </span>
                        <Badge variant="saffron" className="text-[10px] capitalize shrink-0">
                          {pl.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {pl.organizationName && (
                        <p className="text-[11px] text-ayush-teal font-medium">
                          {pl.organizationName}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-ayush-text-muted pt-1">
                        <span>Progress: {Number(pl.progress_percent) || 0}%</span>
                        {pl.start_date && (
                          <span>Started: {new Date(pl.start_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="w-full bg-ayush-parchment/20 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-ayush-saffron h-full rounded-full"
                          style={{ width: `${Number(pl.progress_percent) || 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardShell>
    );
  }

export default function StudentDetailPage(props: StudentDetailPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Student Profile...</div>}>
      <StudentDetailContent {...props} />
    </Suspense>
  );
}
