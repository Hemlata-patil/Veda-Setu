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
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileCheck2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  TrendingUp,
  User,
  ArrowRight,
  Scroll,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Student Dashboard — VEDA SETU",
  description: "Ayush student academic and clinical skills portal",
};

async function StudentDashboardContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let publishedTemplate: {
    id: string;
    title: string;
    description: string | null;
    program: string | null;
    question_count?: number;
  } | null = null;

  let questionCount = 0;
  let competencyCount = 0;
  let studentAttempt: {
    id: string;
    status: string;
    total_score: number | null;
    submitted_at: string | null;
  } | null = null;

  let rawCompetencies: any[] = [];
  let activePlacement: {
    status: string;
    progress_percent: number;
    opportunityTitle: string;
    organizationName?: string | null;
  } | null = null;

  let portfolioItemCount = 0;
  let certificationsCount = 0;
  let projectsCount = 0;

  let activeMentorship: any = null;
  let pendingMentorship: any = null;
  let latestRejectedMentorship: any = null;
  let completedMentorship: any = null;
  let mentorFacultyName: string | null = null;

  if (token) {
    const authHeader = { Cookie: `auth_token=${token}` };

    // 1. Assessment Template & Question Count
    try {
      const tmplRes = await api.get<{
        status: string;
        results: number;
        data: { assessments: any[] };
      }>("/assessments", { headers: authHeader });

      const templates = tmplRes?.data?.assessments || [];
      const firstTemplate = templates[0];
      if (firstTemplate) {
        publishedTemplate = firstTemplate;
        questionCount = firstTemplate.question_count || 0;

        // Fetch questions to derive exact unique competency count
        try {
          const qRes = await api.get<{
            status: string;
            results: number;
            data: { questions: Array<{ id: string; competency_id: string }> };
          }>(`/assessments/${firstTemplate.id}/questions`, { headers: authHeader });

          const questions = qRes?.data?.questions || [];
          if (questions.length > 0) {
            questionCount = questions.length;
            competencyCount = new Set(questions.map((q) => q.competency_id)).size;
          }
        } catch {
          // Keep question_count fallback
        }

        // 1.1 Student attempt check via read-only endpoint
        try {
          const attRes = await api.get<{
            status: string;
            data: {
              attempt: {
                id: string;
                status: string;
                total_score: number | null;
                submitted_at: string | null;
              } | null;
            };
          }>(`/assessments/${firstTemplate.id}/my-attempt`, { headers: authHeader });

          studentAttempt = attRes?.data?.attempt || null;
        } catch {
          studentAttempt = null;
        }
      }
    } catch {
      publishedTemplate = null;
    }

    // 2. Student Competencies
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
      }>("/students/me/competencies", { headers: authHeader });

      const compList = compRes?.data?.competencies || [];
      rawCompetencies = compList.map((c) => ({
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
    } catch {
      rawCompetencies = [];
    }

    // 3. Internship & Placement Record
    try {
      const plcRes = await api.get<{
        status: string;
        data: Array<{
          id: string;
          status: string;
          progressPercent: number;
          opportunity?: { title: string } | null;
          organization?: { name: string } | null;
        }>;
      }>("/placements/student", { headers: authHeader });

      const placementList = (Array.isArray(plcRes) ? plcRes : (plcRes as any)?.data || []) as any[];
      const firstActive = placementList.find((p) => p.status !== "withdrawn");
      if (firstActive) {
        activePlacement = {
          status: firstActive.status,
          progress_percent: Number(firstActive.progressPercent) || 0,
          opportunityTitle: firstActive.opportunity?.title || "Industry Opportunity",
          organizationName: firstActive.organization?.name || null,
        };
      }
    } catch {
      activePlacement = null;
    }

    // 4. Portfolio Items Summary
    try {
      const portRes = await api.get<{
        status: string;
        data: any;
      }>("/portfolio/items", { headers: authHeader });

      const items: any[] = Array.isArray(portRes?.data)
        ? portRes.data
        : (portRes?.data?.items || []);
      portfolioItemCount = items.length;
      certificationsCount = items.filter(
        (i) => (i.item_type || i.itemType) === "certification"
      ).length;
      projectsCount = items.filter(
        (i) => (i.item_type || i.itemType) === "project"
      ).length;
    } catch {
      portfolioItemCount = 0;
      certificationsCount = 0;
      projectsCount = 0;
    }

    // 5. Mentorship Summary
    try {
      const mentorRes = await api.get<{
        status: string;
        data: {
          activeMentorship: any;
          pendingMentorship: any;
          latestRejectedMentorship: any;
          completedMentorships: any[];
        };
      }>("/mentorship/student", { headers: authHeader });

      activeMentorship = mentorRes?.data?.activeMentorship || null;
      pendingMentorship = mentorRes?.data?.pendingMentorship || null;
      latestRejectedMentorship = mentorRes?.data?.latestRejectedMentorship || null;
      completedMentorship = mentorRes?.data?.completedMentorships?.[0] || null;

      mentorFacultyName =
        activeMentorship?.facultyName ||
        pendingMentorship?.facultyName ||
        latestRejectedMentorship?.facultyName ||
        completedMentorship?.facultyName ||
        null;
    } catch {
      activeMentorship = null;
      pendingMentorship = null;
      latestRejectedMentorship = null;
      completedMentorship = null;
      mentorFacultyName = null;
    }

    // 6. Placement Summary
    try {
      const placeRes = await api.get<{
        status: string;
        data: Array<{
          id: string;
          status: string;
          progressPercent: number;
          opportunity?: { title: string };
          organization?: { name: string };
        }>;
      }>("/placements/student", { headers: authHeader });

      const studentPlacements = (placeRes?.data || []).filter(
        (p) => p.status !== "withdrawn"
      );
      if (studentPlacements.length > 0) {
        const p = studentPlacements[0];
        activePlacement = {
          status: p.status,
          progress_percent: Number(p.progressPercent) || 0,
          opportunityTitle: p.opportunity?.title || "Industry Opportunity",
          organizationName: p.organization?.name || null,
        };
      }
    } catch {
      activePlacement = null;
    }
  }

  // Derive standardized Skill Profile & Personalized Roadmap
  const skillProfile = buildStudentSkillProfile(rawCompetencies);
  const roadmapData = buildPersonalizedRoadmap(skillProfile);
  const competenciesCount = rawCompetencies.length;

  // Determine assessment card state
  let assessmentStatusBadge: { label: string; variant: "herbal" | "saffron" | "parchment"; dot?: boolean } = {
    label: "Available",
    variant: "herbal",
    dot: true,
  };
  let actionButton = {
    label: "Start Assessment",
    href: "/student/assessment",
    icon: PlayCircle,
  };

  if (studentAttempt) {
    if (studentAttempt.status === "in_progress") {
      assessmentStatusBadge = {
        label: "In Progress",
        variant: "saffron",
        dot: true,
      };
      actionButton = {
        label: "Continue Assessment",
        href: `/student/assessment/${studentAttempt.id}`,
        icon: PlayCircle,
      };
    } else if (studentAttempt.status === "submitted") {
      assessmentStatusBadge = {
        label: "Completed",
        variant: "herbal",
        dot: false,
      };
      actionButton = {
        label: "View Result",
        href: `/student/assessment/result/${studentAttempt.id}`,
        icon: CheckCircle2,
      };
    }
  }

  let mentorshipStatusBadge: { label: string; variant: "herbal" | "saffron" | "parchment" | "default"; dot?: boolean } = {
    label: "No Mentor",
    variant: "parchment",
  };

  if (activeMentorship) {
    mentorshipStatusBadge = {
      label: "Active Mentor",
      variant: "herbal",
      dot: true,
    };
  } else if (pendingMentorship) {
    mentorshipStatusBadge = {
      label: "Request Pending",
      variant: "saffron",
      dot: true,
    };
  } else if (latestRejectedMentorship) {
    mentorshipStatusBadge = {
      label: "Request Not Accepted",
      variant: "parchment",
    };
  } else if (completedMentorship) {
    mentorshipStatusBadge = {
      label: "Mentorship Completed",
      variant: "parchment",
    };
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "student@institution.edu.in"}
      breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Student Dashboard" }]}
    >
      <PageHeader
        eyebrow="Student Portal"
        eyebrowColor="green"
        title={`Welcome, ${profile?.full_name || "Scholar"}`}
        description="Your personalized academic skills dashboard, clinical milestones, and industry collaboration portal."
        actions={
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/profile">
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </Link>
          </Button>
        }
      />

      {/* 1. Primary Skill Assessment Section */}
      <div className="mb-8">
        {publishedTemplate ? (
          <Card accent="green" className="overflow-hidden border-ayush-green/30 bg-gradient-to-br from-ayush-card via-ayush-card to-ayush-sand/30">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={assessmentStatusBadge.variant} dot={assessmentStatusBadge.dot}>
                      {assessmentStatusBadge.label}
                    </Badge>
                    <span className="text-xs text-ayush-muted font-medium">{publishedTemplate.program || "Ayush Core"}</span>
                  </div>

                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-ayush-dark">
                    {publishedTemplate.title}
                  </h2>

                  <p className="text-xs md:text-sm text-ayush-muted leading-relaxed">
                    {publishedTemplate.description ||
                      "Benchmark your knowledge and clinical self-efficacy across standardized Ayurveda competencies to generate your personalized skill profile."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-ayush-dark">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-ayush-green" />
                      <span className="font-semibold">{questionCount}</span>
                      <span className="text-ayush-muted">Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-ayush-saffron" />
                      <span className="font-semibold">{competencyCount}</span>
                      <span className="text-ayush-muted">Competencies</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-ayush-muted" />
                      <span>~25–30 Mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end justify-center gap-3 shrink-0">
                  {studentAttempt?.status === "submitted" && studentAttempt.total_score !== null && (
                    <div className="text-center md:text-right px-4 py-2 rounded-xl bg-ayush-green/10 border border-ayush-green/20">
                      <span className="text-[10px] uppercase font-semibold text-ayush-muted block">Profile Score</span>
                      <span className="font-heading text-2xl font-bold text-ayush-green">
                        {Math.round(studentAttempt.total_score)}%
                      </span>
                    </div>
                  )}

                  <Button asChild size="lg" className="gap-2 shadow-sm">
                    <Link href={actionButton.href}>
                      <actionButton.icon className="w-4 h-4" />
                      <span>{actionButton.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="text-center py-6 text-ayush-muted text-sm">
              No skill assessment is currently published for your cohort.
            </div>
          </Card>
        )}
      </div>

      {/* 2. My Skill Profile Summary Card */}
      <div className="mb-8">
        <Card className="border-ayush-border/80 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ayush-green">
                    Competency Portfolio
                  </span>
                  {skillProfile.hasCompletedAssessment && (
                    <Badge variant="herbal" dot className="text-[10px]">
                      Assessed
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl md:text-2xl">My Skill Profile</CardTitle>
                <p className="text-xs text-ayush-muted mt-0.5">
                  Your standardized competency breakdown derived from verified assessment responses.
                </p>
              </div>

              {skillProfile.hasCompletedAssessment ? (
                <Button asChild size="sm" className="gap-1.5 self-start sm:self-auto bg-ayush-green hover:bg-ayush-green/90 text-white">
                  <Link href="/student/skill-profile">
                    <span>View Skill Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline" className="gap-1.5 self-start sm:self-auto">
                  <Link href="/student/assessment">
                    <span>Take Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {skillProfile.hasCompletedAssessment ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Overall Score Dial */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-ayush-sand/30 border border-ayush-border/40">
                  <span className="text-xs font-semibold text-ayush-muted uppercase tracking-wider mb-2">
                    Platform Skill Profile Score
                  </span>
                  <div className="flex items-center justify-center w-28 h-28 rounded-full border-4 border-ayush-green/30 bg-ayush-green/5 my-1">
                    <div className="text-center">
                      <span className="font-heading text-4xl font-bold text-ayush-green">
                        {skillProfile.overallScore}
                      </span>
                      <span className="text-[10px] text-ayush-muted block">out of 100</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-ayush-muted mt-2">
                    Across 13 core Ayurveda competencies
                  </p>
                </div>

                {/* 4 Category Scores */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Academic / Domain */}
                  <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-card/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-ayush-green" />
                        Academic & Domain
                      </span>
                      <span className="font-bold text-ayush-dark">
                        {skillProfile.categorySummaries.academic_domain.score}%
                      </span>
                    </div>
                    <Progress
                      value={skillProfile.categorySummaries.academic_domain.score}
                      max={100}
                      variant="green"
                      size="sm"
                    />
                  </div>

                  {/* Clinical / Practical */}
                  <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-card/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-ayush-saffron" />
                        Clinical & Practical
                      </span>
                      <span className="font-bold text-ayush-dark">
                        {skillProfile.categorySummaries.clinical_practical.score}%
                      </span>
                    </div>
                    <Progress
                      value={skillProfile.categorySummaries.clinical_practical.score}
                      max={100}
                      variant="saffron"
                      size="sm"
                    />
                  </div>

                  {/* Research & Evidence */}
                  <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-card/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-ayush-muted" />
                        Research Methodology
                      </span>
                      <span className="font-bold text-ayush-dark">
                        {skillProfile.categorySummaries.research.score}%
                      </span>
                    </div>
                    <Progress
                      value={skillProfile.categorySummaries.research.score}
                      max={100}
                      variant="brown"
                      size="sm"
                    />
                  </div>

                  {/* Professional Practice */}
                  <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-card/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-ayush-green" />
                        Professional Practice
                      </span>
                      <span className="font-bold text-ayush-dark">
                        {skillProfile.categorySummaries.professional.score}%
                      </span>
                    </div>
                    <Progress
                      value={skillProfile.categorySummaries.professional.score}
                      max={100}
                      variant="green"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-ayush-muted max-w-md mx-auto leading-relaxed">
                  Complete your skill assessment to build your skill profile. Your scores across the 4 core domains will appear here.
                </p>
                <Button asChild size="sm" className="bg-ayush-green hover:bg-ayush-green/90 text-white gap-2">
                  <Link href="/student/assessment">
                    <span>Take Assessment</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Learning & Roadmap Summary Card */}
      <div className="mb-8">
        <Card className="border-ayush-border/80 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ayush-saffron">
                    Personalized Development
                  </span>
                  <Badge
                    variant={roadmapData.hasCompetencyData ? "saffron" : "parchment"}
                    className="text-[10px]"
                  >
                    {roadmapData.hasCompetencyData ? roadmapData.currentOverallStage : "Pending Assessment"}
                  </Badge>
                </div>
                <CardTitle className="text-xl">Learning & Roadmap</CardTitle>
                <p className="text-xs text-ayush-muted mt-0.5">
                  Targeted milestones and actionable pedagogical recommendations to strengthen critical clinical and academic skills.
                </p>
              </div>

              <Button asChild size="sm" variant="default" className="gap-1.5 self-start sm:self-auto text-xs">
                <Link href="/student/learning">
                  <span>View Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {roadmapData.hasCompetencyData ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                  <span className="text-xs text-ayush-muted block">Priority Development Areas</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-bold text-amber-800">
                      {roadmapData.priorityCount}
                    </span>
                    <span className="text-xs text-ayush-muted">
                      {roadmapData.priorityCount === 1 ? "Competency" : "Competencies"} &lt; 60%
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                  <span className="text-xs text-ayush-muted block">Current Milestone</span>
                  <div className="font-medium text-xs text-ayush-dark pt-1">
                    {roadmapData.currentOverallStage}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                  <span className="text-xs text-ayush-muted block">Roadmap Guidance</span>
                  <span className="text-xs text-ayush-muted block pt-1">
                    3 progressive stages: Foundations, Practice, and Evidence Demonstration.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-ayush-muted leading-relaxed">
                  Complete your skill assessment to generate your personalized 3-stage competency development roadmap.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Internship & Placement Summary Card */}
      <div className="mb-8">
        <Card className="border-ayush-border/80 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ayush-green">
                    Career Engagement
                  </span>
                  <Badge
                    variant={activePlacement ? "herbal" : "parchment"}
                    className="text-[10px] capitalize"
                  >
                    {activePlacement ? activePlacement.status.replace("_", " ") : "Not Enrolled"}
                  </Badge>
                </div>
                <CardTitle className="text-xl">Internship & Placement</CardTitle>
                <p className="text-xs text-ayush-muted mt-0.5">
                  Real-time status of your official industry apprenticeship, hospital internship, or career placement onboarding.
                </p>
              </div>

              <Button asChild size="sm" variant="default" className="gap-1.5 self-start sm:self-auto text-xs">
                <Link href="/student/internship-placement">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {activePlacement ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-serif font-bold text-ayush-text">
                      {activePlacement.opportunityTitle}
                    </h4>
                    {activePlacement.organizationName && (
                      <p className="text-xs text-ayush-teal font-medium">
                        {activePlacement.organizationName}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-ayush-text">
                      {Number(activePlacement.progress_percent) || 0}%
                    </span>
                    <span className="text-xs text-ayush-muted ml-1">Completed</span>
                  </div>
                </div>

                <div className="w-full bg-ayush-parchment/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-ayush-saffron h-full rounded-full transition-all duration-300"
                    style={{ width: `${Number(activePlacement.progress_percent) || 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-ayush-muted leading-relaxed">
                  No active internship or career placement has been initiated yet. Submit applications to verified industry opportunities to get started.
                </p>
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link href="/student/opportunities">Explore Opportunities</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. My Portfolio Summary Card */}
      <div className="mb-8">
        <Card className="border-ayush-border/80 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ayush-green">
                    Evidence & Credentials
                  </span>
                  <Badge variant="herbal" className="text-[10px]">
                    Academic & Professional
                  </Badge>
                </div>
                <CardTitle className="text-xl">My Portfolio</CardTitle>
                <p className="text-xs text-ayush-muted mt-0.5">
                  Your academic, competency and professional evidence in one place.
                </p>
              </div>

              <Button asChild size="sm" variant="default" className="gap-1.5 self-start sm:self-auto text-xs bg-ayush-green hover:bg-ayush-green/90 text-white">
                <Link href="/student/portfolio">
                  <span>View Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Portfolio Items</span>
                <div className="font-heading text-2xl font-bold text-ayush-dark">
                  {portfolioItemCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Competencies</span>
                <div className="font-heading text-2xl font-bold text-ayush-green">
                  {competenciesCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Certifications</span>
                <div className="font-heading text-2xl font-bold text-ayush-teal">
                  {certificationsCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Projects</span>
                <div className="font-heading text-2xl font-bold text-ayush-saffron">
                  {projectsCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Mentorship Summary Card */}
      <div className="mb-8">
        <Card className="border-ayush-border/80 overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ayush-saffron">
                    Academic Guidance
                  </span>
                  <Badge variant={mentorshipStatusBadge.variant} dot={mentorshipStatusBadge.dot} className="text-[10px]">
                    {mentorshipStatusBadge.label}
                  </Badge>
                </div>
                <CardTitle className="text-xl">My Mentorship</CardTitle>
                <p className="text-xs text-ayush-muted mt-0.5">
                  1-on-1 institutional faculty guidance, clinical milestone coaching, and competency supervision.
                </p>
              </div>

              <Button asChild size="sm" variant="default" className="gap-1.5 self-start sm:self-auto text-xs bg-ayush-green hover:bg-ayush-green/90 text-white">
                <Link href="/student/mentorship">
                  <span>View Mentorship</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Mentorship Status</span>
                <div className="font-heading text-lg font-bold text-ayush-dark flex items-center gap-1.5">
                  {activeMentorship && <CheckCircle2 className="w-4 h-4 text-ayush-green" />}
                  {pendingMentorship && <Clock className="w-4 h-4 text-ayush-saffron" />}
                  {mentorshipStatusBadge.label}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Faculty Mentor</span>
                <div className="font-heading text-lg font-bold text-ayush-dark truncate">
                  {mentorFacultyName || "None Assigned"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Program Scope</span>
                <span className="text-xs text-ayush-muted block pt-0.5">
                  Institutional faculty mentorship within your enrolled Ayush college.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Confirmation & Status Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ayush-muted">Assigned Role</span>
              <Badge variant="herbal" dot>
                Active
              </Badge>
            </div>
            <CardTitle className="text-xl">Student / Scholar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-ayush-muted leading-relaxed">
              Standardized student portal profile linked to verified academic records.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ayush-muted">Skills Registry</span>
              <Badge variant="parchment">13 Competencies</Badge>
            </div>
            <CardTitle className="text-xl">Competency Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-ayush-muted leading-relaxed">
              Mapped against standardized Ayush curriculum and clinical domains.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ayush-muted">Opportunities</span>
              <Badge variant="saffron">Available</Badge>
            </div>
            <CardTitle className="text-xl">Internships & Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-ayush-muted leading-relaxed">
              Skill-based matching with verified Ayush industry and research partners.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Student Portal...
          </div>
        </div>
      }
    >
      <StudentDashboardContent />
    </Suspense>
  );
}
