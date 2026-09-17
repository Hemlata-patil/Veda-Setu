import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { buildStudentSkillProfile } from "@/lib/competencies";
import { buildPersonalizedRoadmap } from "@/lib/learning";
import {
  Compass,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Layers,
  GraduationCap,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { RecommendationCards } from "./recommendation-cards";
import { RoadmapView } from "./roadmap-view";

export const metadata = {
  title: "Learning & Development — VEDA SETU",
  description: "Personalized academic and clinical competency growth roadmap",
};

async function LearningContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let rawRows: any[] = [];

  if (token) {
    try {
      const compRes = await api.get<{
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
      rawRows = list.map((c) => ({
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
      rawRows = [];
    }
  }

  // 2. Build skill profile and personalized roadmap
  const profileData = buildStudentSkillProfile(rawRows as any);
  const roadmapData = buildPersonalizedRoadmap(profileData);

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "scholar@ayush.gov.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "Learning & Roadmap" },
      ]}
    >
      <PageHeader
        eyebrow="Competency Development"
        eyebrowColor="saffron"
        title="Learning & Development"
        description="Build the competencies that matter most for your academic and professional growth."
      />

      {!roadmapData.hasCompetencyData ? (
        /* Empty State when student has no completed assessment */
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ayush-sand/80 text-ayush-brown border border-ayush-border/70">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                No Competency Assessment Completed Yet
              </h3>
              <p className="text-xs text-ayush-muted leading-relaxed">
                Complete your skill assessment to receive a personalized development plan.
              </p>
            </div>
            <Button asChild size="default" className="gap-2 text-xs">
              <Link href="/student/assessment">
                <span>Take Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        /* Full Personalized Roadmap & Learning Experience */
        <div className="space-y-10">
          {/* Important Platform Disclaimer */}
          <div className="rounded-xl border border-ayush-border/80 bg-ayush-card p-4 text-xs text-ayush-muted flex items-start gap-3 shadow-sm">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ayush-herbal/10 text-ayush-herbal">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-ayush-dark">
                Platform-Defined Guidance
              </p>
              <p className="leading-relaxed">
                This personalized roadmap and developmental milestones are generated suggestions designed to help guide your independent learning. They are platform-generated guidance and do not represent official NCISM curricular mandates.
              </p>
            </div>
          </div>

          {/* Section 1: Priority Development Areas */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-xl font-bold text-ayush-dark">
                  Priority Development Areas
                </h3>
                <p className="text-xs text-ayush-muted">
                  Competencies scoring below 60% where targeted practice will produce the highest academic impact.
                </p>
              </div>
              <Badge variant={roadmapData.priorityCount === 0 ? "herbal" : "saffron"}>
                {roadmapData.priorityCount === 0
                  ? "All Core Benchmarks Met"
                  : `${roadmapData.priorityCount} Areas to Strengthen`}
              </Badge>
            </div>

            {roadmapData.priorityAreas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roadmapData.priorityAreas.map((item) => (
                  <Card key={item.competencyId} className="p-5 space-y-3 bg-white border-ayush-border/80 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {item.category.replace(/_/g, " ")}
                      </Badge>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-amber-800">
                          {item.score}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-heading text-base font-bold text-ayush-dark">
                        {item.competencyName}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-ayush-muted line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-ayush-border/50">
                      <Progress value={item.score} className="h-1.5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center bg-ayush-herbal/5 border-ayush-herbal/20">
                <p className="text-xs text-ayush-herbal font-medium">
                  Excellent work! All of your assessed competencies currently meet or exceed the 60% platform benchmark.
                </p>
              </Card>
            )}
          </section>

          {/* Section 2: 3-Stage Personalized Roadmap */}
          <section className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-xl font-bold text-ayush-dark">
                  Personalized Development Roadmap
                </h3>
                <Badge variant="herbal" className="text-[10px]">
                  {roadmapData.currentOverallStage}
                </Badge>
              </div>
              <p className="text-xs text-ayush-muted">
                A progressive 3-stage plan structured to build foundations, practice clinically, and demonstrate evidence.
              </p>
            </div>

            <RoadmapView priorityAreas={roadmapData.priorityAreas} />
          </section>

          {/* Section 3: Development Recommendations */}
          {roadmapData.priorityAreas.length > 0 && (
            <section className="space-y-4">
              <div>
                <h3 className="font-heading text-xl font-bold text-ayush-dark">
                  Development Recommendations
                </h3>
                <p className="text-xs text-ayush-muted">
                  Actionable guidance, contextual relevance, and self-directed progress tracking for each focus area.
                </p>
              </div>

              <RecommendationCards priorityAreas={roadmapData.priorityAreas} />
            </section>
          )}

          {/* Section 4: Keep Building Your Strengths */}
          <section className="space-y-4">
            <div>
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Keep Building Your Strengths
              </h3>
              <p className="text-xs text-ayush-muted">
                Your highest-performing competency areas where you demonstrate advanced proficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roadmapData.topStrengths.map((item) => (
                <Card key={item.competencyId} className="p-5 space-y-3 bg-ayush-herbal/5 border-ayush-herbal/20">
                  <div className="flex items-center justify-between">
                    <Badge variant="herbal" className="text-[10px] capitalize">
                      {item.category.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-heading text-base font-bold text-ayush-herbal">
                      {item.score}%
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading text-base font-bold text-ayush-dark">
                      {item.competencyName}
                    </h4>
                    <p className="text-xs text-ayush-muted mt-2 leading-relaxed">
                      {item.suggestedAction}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Section 5: Category View */}
          <section className="space-y-4">
            <div>
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Competency Categories Overview
              </h3>
              <p className="text-xs text-ayush-muted">
                Real-time performance metrics and priority development distribution across all 4 Ayush platform domains.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {roadmapData.categorySummaries.map((cat) => (
                <Card key={cat.category} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={cat.badgeVariant as any} className="text-[10px]">
                      {cat.shortLabel}
                    </Badge>
                    <span className="font-heading text-xl font-bold text-ayush-dark">
                      {cat.averageScore}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-ayush-dark">
                      {cat.label}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-ayush-border/60 space-y-1 text-xs text-ayush-muted">
                    <div className="flex justify-between">
                      <span>Total Evaluated:</span>
                      <span className="font-semibold text-ayush-dark">{cat.totalCompetencies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority Areas:</span>
                      <span className={`font-semibold ${cat.priorityAreasCount > 0 ? "text-amber-800" : "text-ayush-herbal"}`}>
                        {cat.priorityAreasCount}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

export default function StudentLearningPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Learning & Development Roadmap...
          </div>
        </div>
      }
    >
      <LearningContent />
    </Suspense>
  );
}
