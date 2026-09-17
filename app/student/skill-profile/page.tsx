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
  CATEGORY_CONFIG,
  CompetencyCategory,
  buildStudentSkillProfile,
} from "@/lib/competencies";
import {
  Award,
  BookOpen,
  ChevronRight,
  Compass,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  FileCheck2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "My Skill Profile — VEDA SETU",
  description: "Your current competency profile based on your completed skill assessment",
};

const CATEGORY_ICONS: Record<CompetencyCategory, typeof BookOpen> = {
  academic_domain: GraduationCap,
  clinical_practical: Compass,
  research: BookOpen,
  professional: Award,
};

async function SkillProfileContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let rawCompetencies: any[] = [];

  if (token) {
    try {
      const compRes = await apiFetch<{
        status: string;
        results: number;
        data: {
          competencies: Array<{
            competency_id: string;
            proficiency_score: number | null;
            last_assessed_at: string | null;
            source: string | null;
            verified: boolean;
            competency_name: string;
            competency_category: string;
            competency_description: string | null;
          }>;
        };
      }>("/students/me/competencies", {
        headers: { Cookie: `auth_token=${token}` },
      });

      const list = compRes?.data?.competencies || [];
      rawCompetencies = list.map((c) => ({
        competency_id: c.competency_id,
        proficiency_score: c.proficiency_score,
        last_assessed_at: c.last_assessed_at,
        source: c.source,
        verified: c.verified,
        competencies: {
          id: c.competency_id,
          name: c.competency_name,
          category: c.competency_category,
          description: c.competency_description,
        },
      }));
    } catch (err) {
      console.error("Error fetching competencies:", err);
      rawCompetencies = [];
    }
  }

  const profileData = buildStudentSkillProfile(rawCompetencies || []);

  const formattedAssessedDate = profileData.lastAssessedAt
    ? new Date(profileData.lastAssessedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "student@institution.edu.in"}
      breadcrumbs={[
        { label: "Dashboard", href: "/student/dashboard" },
        { label: "Skill Profile" },
      ]}
    >
      <PageHeader
        eyebrow="Competency Registry"
        eyebrowColor="green"
        title="My Skill Profile"
        description="Your current competency profile based on your completed skill assessment."
        actions={
          profileData.hasCompletedAssessment ? (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/student/assessment">
                <FileCheck2 className="w-4 h-4" />
                <span>Retake / Review Assessment</span>
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* If student has NO completed assessment */}
      {!profileData.hasCompletedAssessment ? (
        <Card className="border-ayush-border/80 p-8 md:p-12 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ayush-sand/80 text-ayush-green border border-ayush-border/70">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-bold text-ayush-dark">
                No Skill Profile Records Found
              </h2>
              <p className="text-sm text-ayush-muted leading-relaxed">
                Complete your skill assessment to build your skill profile. Your personalized profile will accurately map your strengths and development areas across 13 core Ayurveda competencies.
              </p>
            </div>
            <div className="pt-3">
              <Button asChild size="lg" className="gap-2 bg-ayush-green hover:bg-ayush-green/90 text-white">
                <Link href="/student/assessment">
                  <span>Take Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Top Classification Alert */}
          <div className="rounded-2xl border border-ayush-border/70 bg-ayush-card/70 p-4 text-xs text-ayush-muted flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-ayush-saffron shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ayush-dark">Platform Skill Profile Classification: </span>
              Scores reflect your objective knowledge evaluation (80%) and clinical self-efficacy appraisal (20%) mapped to standardized Ayush curricula.
              {formattedAssessedDate && (
                <span className="ml-1 text-ayush-dark font-medium">
                  Last assessed on {formattedAssessedDate}.
                </span>
              )}
            </div>
          </div>

          {/* Top Section: Overall Score + 4 Category Summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score Card */}
            <Card accent="green" className="lg:col-span-1 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-ayush-muted font-medium">Platform Skill Profile</span>
                  <Badge variant="herbal" dot>
                    Active Profile
                  </Badge>
                </div>
                <CardTitle className="text-xl">Overall Competency Score</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-6 flex flex-col items-center justify-center text-center">
                <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-ayush-green/30 bg-ayush-green/5 my-2">
                  <div className="text-center">
                    <span className="font-heading text-5xl font-bold text-ayush-green">
                      {profileData.overallScore}
                    </span>
                    <span className="text-xs text-ayush-muted block">out of 100</span>
                  </div>
                </div>
                <p className="text-xs text-ayush-muted max-w-xs mt-2 leading-relaxed">
                  Calculated from 13 standardized Ayurveda competencies across 4 foundational domains.
                </p>
              </CardContent>
            </Card>

            {/* 4 Category Summary Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(profileData.categorySummaries) as CompetencyCategory[]).map((catKey) => {
                const cat = profileData.categorySummaries[catKey];
                const Icon = CATEGORY_ICONS[catKey] || BookOpen;

                return (
                  <Card key={catKey} className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-ayush-sand/50 text-ayush-green border border-ayush-border/50">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-ayush-dark">{cat.shortLabel}</span>
                        </div>
                        <Badge variant={cat.badgeVariant} className="text-[10px]">
                          {cat.competencyCount} Items
                        </Badge>
                      </div>

                      <div className="my-2">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-2xl font-bold text-ayush-dark font-heading">
                            {cat.score}%
                          </span>
                          <span className="text-[11px] text-ayush-muted">Domain Average</span>
                        </div>
                        <Progress
                          value={cat.score}
                          max={100}
                          variant={cat.score >= 70 ? "green" : cat.score >= 50 ? "saffron" : "brown"}
                          size="sm"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-ayush-muted leading-snug line-clamp-2 mt-2">
                      {CATEGORY_CONFIG[catKey].description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section: Strengths and Priority Development Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Strengths */}
            <Card className="border-ayush-border/80">
              <CardHeader className="pb-3 border-b border-ayush-border/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-ayush-green/10 text-ayush-green">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Current Strengths</CardTitle>
                    <p className="text-xs text-ayush-muted">
                      Your top 3 performing competencies based on assessment evaluation
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {profileData.topStrengths.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-ayush-sand/30 border border-ayush-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ayush-dark flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ayush-green/15 text-ayush-green font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-bold text-ayush-green">{item.score}%</span>
                    </div>
                    <Progress value={item.score} max={100} variant="green" size="sm" />
                    {item.description && (
                      <p className="text-[11px] text-ayush-muted line-clamp-1">{item.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Priority Development Areas */}
            <Card className="border-ayush-border/80">
              <CardHeader className="pb-3 border-b border-ayush-border/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-ayush-saffron/10 text-ayush-saffron">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Priority Development Areas</CardTitle>
                    <p className="text-xs text-ayush-muted">
                      Areas identified for ongoing academic enrichment and focused mentorship
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {profileData.priorityDevelopmentAreas.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-ayush-sand/30 border border-ayush-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ayush-dark flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ayush-saffron/15 text-ayush-saffron font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.score < 60 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-medium border border-amber-500/20">
                            Platform development indicator
                          </span>
                        )}
                        <span className="font-bold text-ayush-saffron">{item.score}%</span>
                      </div>
                    </div>
                    <Progress value={item.score} max={100} variant="saffron" size="sm" />
                    {item.description && (
                      <p className="text-[11px] text-ayush-muted line-clamp-1">{item.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Section: All 13 Competencies Grouped by Category */}
          <div className="space-y-6">
            <div className="border-b border-ayush-border/60 pb-3">
              <h3 className="font-heading text-2xl font-bold text-ayush-dark">
                Curricular Competency Matrix (All 13 Competencies)
              </h3>
              <p className="text-xs text-ayush-muted mt-0.5">
                Detailed breakdown of verified competencies across academic, clinical, research, and professional domains.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(Object.keys(profileData.categorySummaries) as CompetencyCategory[]).map((catKey) => {
                const catMeta = CATEGORY_CONFIG[catKey];
                const Icon = CATEGORY_ICONS[catKey];
                const categoryCompetencies = profileData.competencies.filter(
                  (c) => c.category === catKey
                );

                return (
                  <Card key={catKey} className="overflow-hidden border-ayush-border/80">
                    <CardHeader className="border-b border-ayush-border/40 pb-3 bg-ayush-sand/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-ayush-card text-ayush-green border border-ayush-border/50">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold">{catMeta.label}</CardTitle>
                            <span className="text-[11px] text-ayush-muted">
                              Average: {profileData.categorySummaries[catKey].score}%
                            </span>
                          </div>
                        </div>
                        <Badge variant={catMeta.badgeVariant}>
                          {categoryCompetencies.length} Competencies
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {categoryCompetencies.map((comp) => (
                        <div key={comp.id} className="space-y-1.5 pb-2 border-b border-ayush-border/30 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-ayush-dark">{comp.name}</span>
                            <div className="flex items-center gap-2">
                              {comp.isPriorityDevelopment && (
                                <span className="text-[10px] text-amber-700 font-medium">
                                  Focus Area
                                </span>
                              )}
                              <span className="font-semibold text-ayush-dark">{comp.score}%</span>
                            </div>
                          </div>
                          <Progress
                            value={comp.score}
                            max={100}
                            variant={comp.score >= 70 ? "green" : comp.score >= 50 ? "saffron" : "brown"}
                            size="md"
                          />
                          {comp.description && (
                            <p className="text-[11px] text-ayush-muted leading-relaxed line-clamp-2">
                              {comp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function SkillProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Skill Profile...
          </div>
        </div>
      }
    >
      <SkillProfileContent />
    </Suspense>
  );
}
