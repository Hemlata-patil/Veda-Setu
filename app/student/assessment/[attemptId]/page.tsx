import { requireRole } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssessmentRunner } from "@/components/assessment/assessment-runner";

import { Suspense } from "react";

export const metadata = {
  title: "Assessment Runner — VEDA SETU",
  description: "Ayush student competency assessment session",
};

interface AssessmentRunnerPageProps {
  params: Promise<{
    attemptId: string;
  }>;
}

async function AssessmentRunnerContent({ params }: AssessmentRunnerPageProps) {
  const { attemptId } = await params;
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let templateTitle = "Ayush Skill & Competency Assessment";
  let formattedQuestions: any[] = [];
  const initialAnswers: Record<string, { answerValue?: number; answerText?: string }> = {};

  if (token) {
    try {
      const authHeader = { Cookie: `auth_token=${token}` };

      // 1.1 Fetch Attempt
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
            answers?: Array<{
              question_id: string;
              answer_value: number | null;
              answer_text: string | null;
            }>;
          };
        };
      }>(`/assessments/attempts/${attemptId}`, { headers: authHeader });

      const attempt = attRes?.data?.attempt;
      if (!attempt) {
        notFound();
      }

      // Security check
      if (attempt.student_id !== user.id) {
        notFound();
      }

      // If already submitted, redirect to result page
      if (attempt.status === "submitted") {
        redirect(`/student/assessment/result/${attemptId}`);
      }

      templateTitle = attempt.template_title || templateTitle;

      // Extract existing answers
      if (attempt.answers) {
        for (const ans of attempt.answers) {
          initialAnswers[ans.question_id] = {
            answerValue: ans.answer_value ?? undefined,
            answerText: ans.answer_text ?? undefined,
          };
        }
      }

      // 1.2 Fetch Questions
      const qRes = await api.get<{
        status: string;
        results: number;
        data: {
          questions: Array<{
            id: string;
            assessment_template_id: string;
            competency_id: string;
            question: string;
            question_type: "mcq" | "self_rating";
            weight: number;
            max_score: number;
            options: any;
          }>;
        };
      }>(`/assessments/${attempt.assessment_template_id}/questions`, { headers: authHeader });

      const questions = qRes?.data?.questions || [];

      // 1.3 Fetch Competencies metadata to attach category and name
      let compMap = new Map<string, { name: string; category: string }>();
      try {
        const compRes = await api.get<{
          status: string;
          data: { competencies: Array<{ id: string; name: string; category: string }> };
        }>("/competencies", { headers: authHeader });
        if (compRes?.data?.competencies) {
          compMap = new Map(compRes.data.competencies.map((c) => [c.id, { name: c.name, category: c.category }]));
        }
      } catch {
        // Continue with empty map if competencies metadata call is unavailable
      }

      if (questions.length > 0) {
        formattedQuestions = questions.map((q, idx) => {
          const comp = compMap.get(q.competency_id);
          return {
            id: q.id,
            question_number: idx + 1,
            question_type: q.question_type,
            question_text: q.question,
            options: (q.options as any) || null,
            competency_id: q.competency_id,
            competency: comp
              ? {
                  name: comp.name,
                  category: comp.category,
                }
              : undefined,
          };
        });
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("Backend attempt loader failed:", err?.message);
    }
  }

  if (formattedQuestions.length === 0) {
    return (
      <DashboardShell
        userRole="student"
        userName={profile?.full_name || "Ayush Scholar"}
        userEmail={user.email || "student@institution.edu.in"}
        breadcrumbs={[
          { label: "Dashboard", href: "/student/dashboard" },
          { label: "Assessment", href: "/student/assessment" },
          { label: "Runner" },
        ]}
      >
        <div className="py-12 text-center text-ayush-muted">
          No active questions found for this assessment template.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "student@institution.edu.in"}
      breadcrumbs={[
        { label: "Dashboard", href: "/student/dashboard" },
        { label: "Assessment Overview", href: "/student/assessment" },
        { label: templateTitle },
      ]}
    >
      <AssessmentRunner
        attemptId={attemptId}
        templateTitle={templateTitle}
        questions={formattedQuestions}
        initialAnswers={initialAnswers}
      />
    </DashboardShell>
  );
}

export default function AssessmentRunnerPage(props: AssessmentRunnerPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Assessment Session...
          </div>
        </div>
      }
    >
      <AssessmentRunnerContent {...props} />
    </Suspense>
  );
}
