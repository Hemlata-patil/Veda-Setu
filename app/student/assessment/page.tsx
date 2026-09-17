import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { StartAssessmentButton } from "./start-assessment-button";

export const metadata = {
  title: "Skill Assessment Overview — VEDA SETU",
  description: "Comprehensive Ayush student skill profiling and competency diagnostic assessment",
};

async function AssessmentOverviewContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let template: {
    id: string;
    title: string;
    description: string | null;
    program: string | null;
    status: string;
  } | null = null;

  let attempt: {
    id: string;
    status: string;
    total_score: number | null;
    started_at?: string | null;
    submitted_at: string | null;
  } | null = null;

  if (token) {
    try {
      const authHeader = { Cookie: `auth_token=${token}` };
      const tmplRes = await api.get<{
        status: string;
        results: number;
        data: { assessments: any[] };
      }>("/assessments", { headers: authHeader });

      const templates = tmplRes?.data?.assessments || [];
      const firstTemplate = templates[0];
      if (firstTemplate) {
        template = {
          id: firstTemplate.id,
          title: firstTemplate.title,
          description: firstTemplate.description,
          program: firstTemplate.program,
          status: firstTemplate.status,
        };

        const attRes = await api.get<{
          status: string;
          data: {
            attempt: {
              id: string;
              status: string;
              total_score: number | null;
              started_at?: string | null;
              submitted_at: string | null;
            } | null;
          };
        }>(`/assessments/${firstTemplate.id}/my-attempt`, { headers: authHeader });

        if (attRes?.data?.attempt) {
          attempt = {
            id: attRes.data.attempt.id,
            status: attRes.data.attempt.status,
            total_score: attRes.data.attempt.total_score,
            started_at: attRes.data.attempt.started_at || null,
            submitted_at: attRes.data.attempt.submitted_at,
          };
        }
      }
    } catch {
      template = null;
      attempt = null;
    }
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "student@institution.edu.in"}
      breadcrumbs={[
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "Skill Assessment" },
      ]}
    >
      <PageHeader
        eyebrow="Diagnostic Profiling"
        eyebrowColor="saffron"
        title={template?.title || "Ayush Skill & Competency Assessment"}
        description="A holistic self-reflection and applied knowledge assessment designed to benchmark your competencies across the core Ayush curriculum pillars."
      />

      {/* Notice Banner: Skill-profiling disclaimer */}
      <div className="mb-8 rounded-2xl border border-ayush-border/80 bg-ayush-sand/30 p-5 shadow-warm backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ayush-saffron/15 text-ayush-saffron">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading text-base font-semibold text-ayush-dark">
              Platform Diagnostic Profiling Notice
            </h4>
            <p className="text-xs text-ayush-muted leading-relaxed">
              This assessment is an internal diagnostic profiling tool created for the Ayush Academia–Industry Collaboration Platform. It is <strong className="text-ayush-dark font-medium">not</strong> an official NCISM regulatory examination, university grading test, or certification exam. Its sole purpose is to estimate your competency profile, highlight strengths, and recommend customized internship and research opportunities.
            </p>
          </div>
        </div>
      </div>

      {!template ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ayush-muted">
            No published assessment template is currently available. Please check back later or contact your institution administrator.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Assessment Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-ayush-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-ayush-herbal">
                    Assessment Structure
                  </span>
                  <Badge variant="herbal" dot>
                    Published & Active
                  </Badge>
                </div>
                <CardTitle className="text-2xl mt-1">
                  Structure & Learning Pillars
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <p className="text-sm text-ayush-muted leading-relaxed">
                  {template.description}
                </p>

                {/* 4 Pillars Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-ayush-border/70 bg-ayush-sand/20 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-ayush-dark font-medium text-sm">
                      <BookOpen className="w-4 h-4 text-ayush-green" />
                      <span>Academic / Domain</span>
                    </div>
                    <p className="text-xs text-ayush-muted">
                      Foundational Ayurvedic principles, conceptual application, and integrated contemporary sciences.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ayush-border/70 bg-ayush-sand/20 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-ayush-dark font-medium text-sm">
                      <GraduationCap className="w-4 h-4 text-ayush-green" />
                      <span>Clinical / Practical</span>
                    </div>
                    <p className="text-xs text-ayush-muted">
                      Clinical history, patient examination, diagnostic interpretation, and medical documentation.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ayush-border/70 bg-ayush-sand/20 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-ayush-dark font-medium text-sm">
                      <Sparkles className="w-4 h-4 text-ayush-green" />
                      <span>Research & Statistics</span>
                    </div>
                    <p className="text-xs text-ayush-muted">
                      Research methodology, statistical literacy, evidence appraisal, and scientific writing.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ayush-border/70 bg-ayush-sand/20 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-ayush-dark font-medium text-sm">
                      <Award className="w-4 h-4 text-ayush-green" />
                      <span>Professional Practice</span>
                    </div>
                    <p className="text-xs text-ayush-muted">
                      Code of medical conduct, patient confidentiality, informed consent, and team collaboration.
                    </p>
                  </div>
                </div>

                {/* Question Breakdown List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-ayush-muted">
                    Format Guidelines
                  </h4>
                  <ul className="space-y-2 text-xs text-ayush-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ayush-green shrink-0" />
                      <span><strong>13 Multiple Choice Questions (MCQ):</strong> Applied scenario questions with 4 choices.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ayush-green shrink-0" />
                      <span><strong>13 Self-Reflection Ratings:</strong> 5-point confidence ratings for practical self-assessment.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ayush-green shrink-0" />
                      <span><strong>Autosave:</strong> Every question is saved in real time as you make your selection.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ayush-green shrink-0" />
                      <span><strong>Weighted Scoring:</strong> 80% MCQ applied understanding + 20% self-assessment confidence.</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Metrics & Call to Action */}
          <div className="space-y-6">
            <Card accent="green">
              <CardHeader className="pb-3">
                <span className="text-xs text-ayush-muted uppercase tracking-wider font-semibold">
                  Assessment Overview
                </span>
                <CardTitle className="text-xl">Your Session Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 divide-y divide-ayush-border/40 text-xs">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-ayush-muted flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Total Questions
                    </span>
                    <span className="font-semibold text-ayush-dark">26 Items</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-ayush-muted flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Competencies Mapped
                    </span>
                    <span className="font-semibold text-ayush-dark">13 Core Skills</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-ayush-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Estimated Duration
                    </span>
                    <span className="font-semibold text-ayush-dark">20 – 25 Minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-ayush-muted">Current Status</span>
                    {attempt?.status === "submitted" ? (
                      <Badge variant="herbal" dot>Completed</Badge>
                    ) : attempt?.status === "in_progress" || attempt?.status === "not_started" ? (
                      <Badge variant="saffron" dot>In Progress</Badge>
                    ) : (
                      <Badge variant="outline">Available</Badge>
                    )}
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="pt-2">
                  {attempt?.status === "submitted" ? (
                    <Button asChild className="w-full gap-2" variant="default">
                      <Link href={`/student/assessment/result/${attempt.id}`}>
                        <span>View Assessment Results</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : attempt?.status === "in_progress" || attempt?.status === "not_started" ? (
                    <Button asChild className="w-full gap-2 bg-ayush-green hover:bg-ayush-green/90 text-white">
                      <Link href={`/student/assessment/${attempt.id}`}>
                        <span>Continue Assessment</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <StartAssessmentButton templateId={template.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function AssessmentOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Assessment Overview...
          </div>
        </div>
      }
    >
      <AssessmentOverviewContent />
    </Suspense>
  );
}
