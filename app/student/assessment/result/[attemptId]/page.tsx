import { requireRole } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Assessment Result — VEDA SETU",
  description: "Platform Skill Profile Score & Competency Breakdown",
};

interface ResultPageProps {
  params: Promise<{
    attemptId: string;
  }>;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof BookOpen; badgeVariant: "herbal" | "saffron" | "parchment" }
> = {
  academic_domain: {
    label: "Academic & Domain Foundations",
    icon: GraduationCap,
    badgeVariant: "herbal",
  },
  clinical_practical: {
    label: "Clinical & Practical Competencies",
    icon: Compass,
    badgeVariant: "saffron",
  },
  research: {
    label: "Research & Evidence-Based Methodology",
    icon: BookOpen,
    badgeVariant: "parchment",
  },
  professional: {
    label: "Professional & Interdisciplinary Practice",
    icon: Award,
    badgeVariant: "herbal",
  },
};

interface CompetencyRecord {
  id: string;
  name: string;
  category: string;
  description: string | null;
  score: number;
}

async function AssessmentResultContent({ params }: ResultPageProps) {
  const { attemptId } = await params;
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let attempt: any = null;
  let competenciesList: CompetencyRecord[] = [];
  let templateTitle = "Ayush Skill Assessment";

  if (token) {
    try {
      const authHeader = { Cookie: `auth_token=${token}` };
      const attRes = await api.get<{
        status: string;
        data: {
          attempt: {
            id: string;
            student_id: string;
            assessment_template_id: string;
            status: string;
            started_at: string | null;
            submitted_at: string | null;
            total_score: number | null;
            template_title: string;
          };
        };
      }>(`/assessments/attempts/${attemptId}`, { headers: authHeader });

      attempt = attRes?.data?.attempt;
      if (!attempt) {
        notFound();
      }

      // Security check
      if (attempt.student_id !== user.id) {
        notFound();
      }

      if (attempt.status !== "submitted") {
        redirect(`/student/assessment/${attemptId}`);
      }

      templateTitle = attempt.template_title || templateTitle;

      // 2. Fetch all student competencies
      const compRes = await api.get<{
        status: string;
        results: number;
        data: {
          competencies: Array<{
            id: string;
            student_id: string;
            competency_id: string;
            proficiency_score: number | null;
            last_assessed_at: string | null;
            competency_name: string;
            competency_category: string;
            competency_description: string | null;
          }>;
        };
      }>("/students/me/competencies", { headers: authHeader });

      competenciesList = (compRes?.data?.competencies || []).map((sc) => ({
        id: sc.competency_id,
        name: sc.competency_name,
        category: sc.competency_category,
        description: sc.competency_description,
        score: Number(sc.proficiency_score) || 0,
      }));
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("Backend assessment result loader failed:", err?.message);
    }
  }

  if (!attempt) {
    notFound();
  }

  // Sort descending by score
  const sortedCompetencies = [...competenciesList].sort((a, b) => b.score - a.score);

  // Top Strengths (top 3)
  const topStrengths = sortedCompetencies.slice(0, 3);

  // Priority Development Areas (bottom 3, sorted ascending for clarity)
  const priorityDevelopmentAreas = [...sortedCompetencies].reverse().slice(0, 3);

  // Group by category
  const groupedByCategory: Record<string, CompetencyRecord[]> = {
    academic_domain: [],
    clinical_practical: [],
    research: [],
    professional: [],
  };

  for (const comp of competenciesList) {
    if (groupedByCategory[comp.category]) {
      groupedByCategory[comp.category].push(comp);
    } else {
      groupedByCategory[comp.category] = [comp];
    }
  }

  const overallScore = Math.round(Number(attempt.total_score) || 0);

  const formattedDate = attempt.submitted_at
    ? new Date(attempt.submitted_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Submitted";

  const templateData = {
    title:
      templateTitle ||
      (Array.isArray(attempt.assessment_templates)
        ? attempt.assessment_templates[0]?.title
        : attempt.assessment_templates?.title) ||
      "Ayush Skill Assessment",
  };

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "student@institution.edu.in"}
      breadcrumbs={[
        { label: "Dashboard", href: "/student/dashboard" },
        { label: "Assessment Overview", href: "/student/assessment" },
        { label: "Result" },
      ]}
    >
      <PageHeader
        eyebrow="Skill Profile Summary"
        eyebrowColor="green"
        title="Assessment Result & Competency Profile"
        description={`Diagnostic evaluation completed on ${formattedDate} for ${templateData?.title || "Ayush Skill Assessment"}.`}
        actions={
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/student/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 bg-ayush-green hover:bg-ayush-green/90 text-white">
              <Link href="/student/skill-profile">
                <span>View Full Skill Profile</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        }
      />

      {/* Official Disclaimer Alert */}
      <div className="mb-8 rounded-2xl border border-ayush-border/70 bg-ayush-card/70 p-4 text-xs text-ayush-muted flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-ayush-saffron shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ayush-dark">Diagnostic Profile Classification: </span>
          The score shown below is a verified <span className="font-medium text-ayush-dark">Platform Skill Profile Score</span> derived from your objective knowledge assessment (80%) and subjective self-efficacy appraisal (20%). It serves as an internal benchmark for academic guidance, skill-gap analysis, and industry opportunity matching. It does not constitute an official NCISM examination grade or university degree credential.
        </div>
      </div>

      {/* Score Overview Hero Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Score Card */}
        <Card accent="green" className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-ayush-muted font-medium">Platform Skill Profile Score</span>
              <Badge variant="herbal" dot>
                Verified
              </Badge>
            </div>
            <CardTitle className="text-xl">Overall Competency</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-6 flex flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-ayush-green/30 bg-ayush-green/5 my-2">
              <div className="text-center">
                <span className="font-heading text-5xl font-bold text-ayush-green">{overallScore}</span>
                <span className="text-xs text-ayush-muted block">out of 100</span>
              </div>
            </div>
            <p className="text-xs text-ayush-muted max-w-xs mt-2 leading-relaxed">
              Calculated across 13 core Ayurveda competencies with dual-layer validation.
            </p>
          </CardContent>
        </Card>

        {/* Top Strengths */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ayush-green" />
              <CardTitle className="text-base font-semibold">Top Strengths</CardTitle>
            </div>
            <p className="text-xs text-ayush-muted">
              Highest scoring areas in this assessment cycle
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {topStrengths.map((item, idx) => (
              <div key={item.id} className="space-y-1.5 p-3 rounded-xl bg-ayush-sand/30 border border-ayush-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ayush-dark flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ayush-green/10 text-ayush-green font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    {item.name}
                  </span>
                  <span className="font-bold text-ayush-green">{item.score}%</span>
                </div>
                <Progress value={item.score} max={100} variant="green" size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority Development Areas */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-ayush-saffron" />
              <CardTitle className="text-base font-semibold">Priority Development Areas</CardTitle>
            </div>
            <p className="text-xs text-ayush-muted">
              Recommended focus areas for enrichment and mentorship
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityDevelopmentAreas.map((item, idx) => (
              <div key={item.id} className="space-y-1.5 p-3 rounded-xl bg-ayush-sand/30 border border-ayush-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ayush-dark flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ayush-saffron/10 text-ayush-saffron font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    {item.name}
                  </span>
                  <span className="font-bold text-ayush-saffron">{item.score}%</span>
                </div>
                <Progress value={item.score} max={100} variant="saffron" size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Competency Breakdown by Category */}
      <div className="space-y-6">
        <div>
          <h3 className="font-heading text-2xl font-bold text-ayush-dark">
            Curricular Competency Matrix
          </h3>
          <p className="text-xs text-ayush-muted">
            Individual proficiency scores mapped to standard Ayush educational and clinical domains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedByCategory).map(([catKey, items]) => {
            const meta = CATEGORY_META[catKey] || {
              label: catKey.replace("_", " ").toUpperCase(),
              icon: BookOpen,
              badgeVariant: "parchment" as const,
            };
            const Icon = meta.icon;

            return (
              <Card key={catKey} className="overflow-hidden">
                <CardHeader className="border-b border-ayush-border/40 pb-3 bg-ayush-sand/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-ayush-card text-ayush-green border border-ayush-border/50">
                        <Icon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base font-semibold">{meta.label}</CardTitle>
                    </div>
                    <Badge variant={meta.badgeVariant}>{items.length} Competencies</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {items.map((comp) => (
                    <div key={comp.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-ayush-dark">{comp.name}</span>
                        </div>
                        <span className="font-semibold text-ayush-dark">{comp.score}%</span>
                      </div>
                      <Progress
                        value={comp.score}
                        max={100}
                        variant={comp.score >= 70 ? "green" : comp.score >= 50 ? "saffron" : "brown"}
                        size="md"
                      />
                      {comp.description && (
                        <p className="text-[11px] text-ayush-muted leading-relaxed line-clamp-1">
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

      {/* Next Steps CTA */}
      <div className="mt-8 rounded-2xl border border-ayush-border bg-gradient-to-r from-ayush-sand/60 to-ayush-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-heading text-lg font-bold text-ayush-dark">
            Next: Explore Your Student Dashboard
          </h4>
          <p className="text-xs text-ayush-muted max-w-lg">
            Your competency profile is permanently synchronized with your profile. You can reference these scores when exploring collaborative research, internships, and clinical rotations.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/student/dashboard">Dashboard</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 bg-ayush-green hover:bg-ayush-green/90 text-white">
            <Link href="/student/skill-profile">
              <span>View Skill Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function AssessmentResultPage(props: ResultPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Assessment Result...
          </div>
        </div>
      }
    >
      <AssessmentResultContent {...props} />
    </Suspense>
  );
}
