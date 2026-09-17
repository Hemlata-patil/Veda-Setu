import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  Award,
  ArrowUpRight,
  User,
  AlertCircle,
  Building2,
  Sparkles,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buildStudentSkillProfile } from "@/lib/competencies";

export const metadata = {
  title: "Cohort Students — VEDA SETU",
  description: "Collegiate student directory, skill assessment status, and mentorship oversight",
};

interface ExpressStudentSummary {
  id: string;
  fullName: string;
  email: string;
  program: string | null;
  year: number | null;
  department: string | null;
  createdAt: string;
  hasAssessment: boolean;
  overallScore: number | null;
}

async function InstitutionStudentsContent() {
  const { user, profile } = await requireRole("institution");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // ── Express path ─────────────────────────────────────────────────────────────
  if (token) {
    let students: ExpressStudentSummary[] = [];
    let institutionName: string = "Affiliated Institution";
    let institutionCode: string | null = null;
    let fetchError: string | null = null;

    try {
      const [studRes, dashRes] = await Promise.all([
        apiFetch<{ status: string; data: { students: ExpressStudentSummary[] } }>(
          "/institution/students",
          { headers: { Cookie: `auth_token=${token}` } }
        ),
        apiFetch<{ status: string; data: { institution: { name: string; code: string | null } } }>(
          "/institution/dashboard",
          { headers: { Cookie: `auth_token=${token}` } }
        ).catch(() => null),
      ]);
      students = studRes.data.students;
      if (dashRes?.data?.institution) {
        institutionName = dashRes.data.institution.name || institutionName;
        institutionCode = dashRes.data.institution.code;
      }
    } catch (err: any) {
      if (err.message?.includes("403") || err.message?.includes("affiliated")) {
        return (
          <DashboardShell
            userRole="institution"
            userName={profile?.full_name || "Institution Administrator"}
            userEmail={user.email || "admin@institution.edu.in"}
            breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard", href: "/institution/dashboard" }, { label: "Students" }]}
          >
            <PageHeader eyebrow="Cohort Management" eyebrowColor="brown" title="Campus Students" description="Collegiate student directory and academic competency oversight." />
            <div className="p-6 rounded-xl bg-ayush-parchment/10 border border-ayush-parchment/30">
              <div className="flex items-start gap-4">
                <span className="p-3 rounded-lg bg-ayush-parchment/20 text-ayush-saffron shrink-0"><AlertCircle className="w-6 h-6" /></span>
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-ayush-text">Institutional Affiliation Required</h3>
                  <p className="text-sm text-ayush-text-muted leading-relaxed">Your account is not linked to an institution record.</p>
                  <div className="pt-2"><Button asChild size="sm" variant="saffron"><Link href="/profile">Update Profile</Link></Button></div>
                </div>
              </div>
            </div>
          </DashboardShell>
        );
      }
      fetchError = err.message;
    }

    if (fetchError) {
      return (
        <DashboardShell
          userRole="institution"
          userName={profile?.full_name || "Institution Administrator"}
          userEmail={user.email || "admin@institution.edu.in"}
          breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard", href: "/institution/dashboard" }, { label: "Students" }]}
        >
          <div className="p-6 rounded-xl border border-ayush-terracotta/20 bg-ayush-terracotta/10 text-ayush-terracotta text-xs mt-4">
            Failed to load students: {fetchError}
          </div>
        </DashboardShell>
      );
    }

    const assessedCount = students.filter((s) => s.hasAssessment).length;

    return (
      <DashboardShell
        userRole="institution"
        userName={profile?.full_name || "Institution Administrator"}
        userEmail={user.email || "admin@institution.edu.in"}
        breadcrumbs={[
          { label: "Ayush Portal", href: "/" },
          { label: "Institution Dashboard", href: "/institution/dashboard" },
          { label: "Students" },
        ]}
      >
        <PageHeader
          eyebrow="Collegiate Cohort"
          eyebrowColor="brown"
          title="Enrolled Students Directory"
          description={`Active student population affiliated with ${institutionName}.`}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="herbal">{assessedCount} / {students.length} Assessed</Badge>
            </div>
          }
        />

        {/* Cohort Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-lg bg-ayush-surface-raised border border-ayush-border/60 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-ayush-muted" />
            <span className="font-semibold text-ayush-text">{institutionName}</span>
            {institutionCode && <span className="text-ayush-muted">&bull; Code: {institutionCode}</span>}
          </div>
          <div className="flex items-center gap-4 text-ayush-muted">
            <span>Total Students: <strong className="text-ayush-text">{students.length}</strong></span>
            <span>Assessed: <strong className="text-ayush-text">{assessedCount}</strong></span>
            <span>Pending: <strong className="text-ayush-text">{students.length - assessedCount}</strong></span>
          </div>
        </div>

        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Students Registered"
            description="There are currently no students registered under your institution."
          />
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <Card key={student.id} className="overflow-hidden hover:border-ayush-border transition-colors">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Student Identity */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ayush-surface-raised flex items-center justify-center text-ayush-muted border border-ayush-border shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-ayush-text">{student.fullName || "Ayush Student"}</h4>
                        <p className="text-xs text-ayush-muted mt-0.5">
                          {student.program || "BAMS"} &bull; {student.year ? `Year ${student.year}` : "Enrolled"} &bull; {student.department || "Ayurveda Samhita & Siddhanta"}
                        </p>
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex flex-wrap items-center gap-3">
                      {student.hasAssessment ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="herbal">Assessed</Badge>
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-ayush-surface-raised border border-ayush-border text-xs">
                            <Award className="w-3.5 h-3.5 text-ayush-saffron" />
                            <span className="font-bold text-ayush-text">{student.overallScore}%</span>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="parchment">Assessment Pending</Badge>
                      )}

                      {/* Priority Areas hint — backend provides overallScore; FE can derive from per-comp data but we keep it simple */}
                      {student.hasAssessment && student.overallScore !== null && student.overallScore < 60 && (
                        <div className="flex items-center gap-1 text-xs text-ayush-muted">
                          <Sparkles className="w-3 h-3 text-ayush-saffron" />
                          <span>Priority Development</span>
                        </div>
                      )}

                      <Button asChild size="sm" variant="outline" className="gap-1 text-xs">
                        <Link href={`/institution/students/${student.id}`}>
                          <span>View Profile</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      userRole="institution"
      userName={profile?.full_name || "Institution Administrator"}
      userEmail={user.email || "admin@institution.edu.in"}
      breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard", href: "/institution/dashboard" }, { label: "Students" }]}
    >
      <div className="p-6 rounded-xl border border-ayush-border/60 bg-ayush-surface-raised text-xs text-ayush-muted">
        Unable to load students directory. Please check your network connection or sign in again.
      </div>
    </DashboardShell>
  );
}

export default function InstitutionStudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Cohort Students...</div>}>
      <InstitutionStudentsContent />
    </Suspense>
  );
}
