import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Award,
  GraduationCap,
  Briefcase,
  BarChart3,
  Building2,
  ArrowUpRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  UserCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Institution Dashboard — VEDA SETU",
  description: "Collegiate academic oversight, student competency tracking, and institutional analytics",
};

// ─── Express backend shapes ───────────────────────────────────────────────────
interface ExpressDashboard {
  institution: {
    id: string;
    name: string;
    code: string | null;
    category: string | null;
    location: string | null;
    verification_status: string;
  };
  metrics: {
    totalStudents: number;
    totalFaculty: number;
    assessedStudentsCount: number;
    averageCohortScore: number | null;
    activeMentorshipsCount: number;
    totalPlacementsCount: number;
    activePlacementsCount: number;
    completedPlacementsCount: number;
  };
  applicationStats: {
    total: number;
    applied: number;
    underReview: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    withdrawn: number;
  };
}

async function InstitutionDashboardContent() {
  const { user, profile } = await requireRole("institution");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // ── Express path ─────────────────────────────────────────────────────────────
  if (token) {
    let dashboard: ExpressDashboard | null = null;
    let fetchError: string | null = null;

    try {
      const res = await apiFetch<{ status: string; data: ExpressDashboard }>(
        "/institution/dashboard",
        { headers: { Cookie: `auth_token=${token}` } }
      );
      dashboard = res.data;
    } catch (err: any) {
      // 403 = institution not linked — show affiliation banner
      if (err.message?.includes("403") || err.message?.includes("affiliated")) {
        return (
          <DashboardShell
            userRole="institution"
            userName={profile?.full_name || "Collegiate Administrator"}
            userEmail={user.email || "admin@institution.edu.in"}
            breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard" }]}
          >
            <PageHeader
              eyebrow="Institution Portal"
              eyebrowColor="brown"
              title={`Welcome, ${profile?.full_name || "Institution Administrator"}`}
              description="Collegiate governance, cohort skill progression, and institutional analytics."
            />
            <div className="p-6 rounded-xl bg-ayush-parchment/10 border border-ayush-parchment/30 mb-8">
              <div className="flex items-start gap-4">
                <span className="p-3 rounded-lg bg-ayush-parchment/20 text-ayush-saffron shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-ayush-text">Institutional Linkage Required</h3>
                  <p className="text-sm text-ayush-text-muted leading-relaxed">
                    Your administrative profile is not currently linked to an academic institution record.
                    Institutional affiliation is required to monitor student cohorts and view aggregate metrics.
                  </p>
                  <div className="pt-2">
                    <Button asChild size="sm" variant="saffron">
                      <Link href="/profile">Update Profile &amp; Affiliation</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DashboardShell>
        );
      }
      fetchError = err.message;
    }

    if (!dashboard) {
      return (
        <DashboardShell
          userRole="institution"
          userName={profile?.full_name || "Institution Administrator"}
          userEmail={user.email || "admin@institution.edu.in"}
          breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard" }]}
        >
          <div className="p-6 rounded-xl border border-ayush-terracotta/20 bg-ayush-terracotta/10 text-ayush-terracotta text-xs mt-4">
            Failed to load dashboard: {fetchError}
          </div>
        </DashboardShell>
      );
    }

    const { institution, metrics, applicationStats } = dashboard;

    return (
      <DashboardShell
        userRole="institution"
        userName={profile?.full_name || "Institution Administrator"}
        userEmail={user.email || "admin@institution.edu.in"}
        breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard" }]}
      >
        <PageHeader
          eyebrow="Institution Administration"
          eyebrowColor="brown"
          title={`Welcome, ${profile?.full_name || "Administrator"}`}
          description={`Collegiate cohort skill monitoring and institutional governance for ${institution?.name || "Affiliated Campus"}.`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="default" className="bg-ayush-brown hover:bg-ayush-brown/90 text-white font-semibold gap-1.5 shadow-warm">
                <Link href="/institution/faculty?action=add">
                  <Plus className="w-4 h-4" />
                  <span>Add Faculty</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href="/institution/faculty">
                  <GraduationCap className="w-4 h-4" />
                  <span>Faculty Directory</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href="/institution/students">
                  <Users className="w-4 h-4" />
                  <span>View Students</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="saffron" className="gap-1.5">
                <Link href="/institution/analytics">
                  <BarChart3 className="w-4 h-4" />
                  <span>Institutional Analytics</span>
                </Link>
              </Button>
            </div>
          }
        />

        {/* Institution Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-8 rounded-lg bg-ayush-surface-raised border border-ayush-border/60">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-lg bg-ayush-brown/10 text-ayush-brown">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-ayush-text">{institution?.name || "Affiliated Institution"}</h3>
              <p className="text-xs text-ayush-muted">
                Campus Code: <strong className="text-ayush-text">{institution?.code || "INST"}</strong> &bull; {institution?.location || "India"} &bull; NCISM / Ayush Recognized
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="herbal">Academic Institution</Badge>
            <Badge variant="parchment">{metrics.totalFaculty} Faculty Members</Badge>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Metric 1: Total Students */}
          <Card accent="saffron">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Total Students</span>
                <Users className="w-4 h-4 text-ayush-saffron" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">{metrics.totalStudents}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">Enrolled students in collegiate cohort</p>
            </CardContent>
          </Card>

          {/* Metric 2: Assessed Students */}
          <Card accent="green">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Assessed Students</span>
                <Award className="w-4 h-4 text-ayush-green" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">{metrics.assessedStudentsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">
                {metrics.totalStudents > 0
                  ? `${Math.round((metrics.assessedStudentsCount / metrics.totalStudents) * 100)}% evaluation rate`
                  : "No students enrolled"}
              </p>
            </CardContent>
          </Card>

          {/* Metric 3: Average Skill Profile Score */}
          <Card accent="brown">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Avg Skill Profile Score</span>
                <Sparkles className="w-4 h-4 text-ayush-saffron" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">
                {metrics.averageCohortScore !== null ? `${metrics.averageCohortScore}%` : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">Mean composite score across assessed students</p>
            </CardContent>
          </Card>

          {/* Metric 4: Active Mentorships */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Active Mentorships</span>
                <GraduationCap className="w-4 h-4 text-ayush-muted" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">{metrics.activeMentorshipsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">Active 1-on-1 faculty mentorship relationships</p>
            </CardContent>
          </Card>

          {/* Metric 5: Total Applications */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Total Applications</span>
                <Briefcase className="w-4 h-4 text-ayush-muted" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">{applicationStats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">Student submissions to industry opportunities</p>
            </CardContent>
          </Card>

          {/* Metric 6: Shortlisted Applications */}
          <Card accent="saffron">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Shortlisted</span>
                <Award className="w-4 h-4 text-ayush-saffron" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">{applicationStats.shortlisted}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">Candidates advanced by industry partners</p>
            </CardContent>
          </Card>

          {/* Metric 7: Selected Applications */}
          <Card accent="green">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ayush-muted">Selected</span>
                <CheckCircle2 className="w-4 h-4 text-ayush-green" />
              </div>
              <CardTitle className="text-2xl font-bold mt-1">{applicationStats.selected}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-ayush-muted">Confirmed apprenticeships &amp; placements</p>
            </CardContent>
          </Card>

          {/* Metric 8: Total Faculty */}
          <Link href="/institution/faculty" className="block group">
            <Card className="h-full hover:border-ayush-border transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ayush-muted">Campus Faculty</span>
                  <UserCheck className="w-4 h-4 text-ayush-muted group-hover:text-ayush-brown transition-colors" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1 group-hover:text-ayush-brown transition-colors">
                  {metrics.totalFaculty}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-ayush-muted">Academic mentors affiliated with institution</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Operational Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cohort Monitoring Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-ayush-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Student Cohort Monitoring</CardTitle>
                  <p className="text-xs text-ayush-muted mt-0.5">
                    Direct visibility into campus student evaluations and clinical progress
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1 text-xs">
                  <Link href="/institution/students">
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-ayush-text-muted leading-relaxed">
                Track individual student competencies across Academic &amp; Domain, Clinical &amp; Practical, Research,
                and Professional Practice. Access full profiles and monitor active faculty mentorship.
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 text-xs">
                <span className="text-ayush-muted">Total Enrolled Cohort:</span>
                <strong className="text-ayush-text">{metrics.totalStudents} Students</strong>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 text-xs">
                <span className="text-ayush-muted">Competency Evaluations Completed:</span>
                <strong className="text-ayush-text">{metrics.assessedStudentsCount} Students ({metrics.totalStudents > 0 ? Math.round((metrics.assessedStudentsCount / metrics.totalStudents) * 100) : 0}%)</strong>
              </div>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/institution/students">Open Cohort Directory</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Institutional Analytics Card */}
          <Card accent="saffron">
            <CardHeader className="pb-3 border-b border-ayush-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Institutional Analytics</CardTitle>
                  <p className="text-xs text-ayush-muted mt-0.5">
                    Aggregate outcomes, domain benchmarking, and priority development areas
                  </p>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1 text-xs">
                  <Link href="/institution/analytics">
                    <span>Deep Dive</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-ayush-text-muted leading-relaxed">
                Evaluate campus-wide strengths and curricular development priorities. Review application funnel metrics
                and mentorship coverage to drive collegiate excellence.
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 text-xs">
                <span className="text-ayush-muted">Average Campus Proficiency:</span>
                <strong className="text-ayush-text">{metrics.averageCohortScore !== null ? `${metrics.averageCohortScore}%` : "Pending Evaluation"}</strong>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50 text-xs">
                <span className="text-ayush-muted">Industry Application Funnel:</span>
                <strong className="text-ayush-text">{applicationStats.total} Total &bull; {applicationStats.shortlisted} Shortlisted &bull; {applicationStats.selected} Selected</strong>
              </div>
              <Button asChild size="sm" variant="saffron" className="w-full">
                <Link href="/institution/analytics">Open Institutional Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Internship & Placement Outcomes Summary Card */}
        <div className="mt-6">
          <Card accent="green">
            <CardHeader className="pb-3 border-b border-ayush-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Internship &amp; Placement Outcomes</CardTitle>
                  <p className="text-xs text-ayush-muted mt-0.5">
                    Track student transition from campus skill evaluation into enterprise apprenticeships and career roles
                  </p>
                </div>
                <Button asChild size="sm" variant="default" className="gap-1 text-xs">
                  <Link href="/institution/internship-placement">
                    <span>Oversight Registry</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-surface-raised space-y-1">
                  <span className="text-xs text-ayush-muted block">Initiated Placements</span>
                  <span className="font-heading text-2xl font-bold text-ayush-text">{metrics.totalPlacementsCount}</span>
                  <span className="text-[11px] text-ayush-muted block">Total selections tracked</span>
                </div>

                <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-surface-raised space-y-1">
                  <span className="text-xs text-ayush-muted block">Currently Active</span>
                  <span className="font-heading text-2xl font-bold text-ayush-saffron">{metrics.activePlacementsCount}</span>
                  <span className="text-[11px] text-ayush-muted block">Joined or In Progress</span>
                </div>

                <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-surface-raised space-y-1">
                  <span className="text-xs text-ayush-muted block">Completed Engagements</span>
                  <span className="font-heading text-2xl font-bold text-emerald-700">{metrics.completedPlacementsCount}</span>
                  <span className="text-[11px] text-ayush-muted block">Successfully certified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      userRole="institution"
      userName={profile?.full_name || "Institution Administrator"}
      userEmail={user.email || "admin@institution.edu.in"}
      breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard" }]}
    >
      <div className="p-6 rounded-xl border border-ayush-border/60 bg-ayush-surface-raised text-xs text-ayush-muted">
        Unable to load institutional dashboard. Please check your network connection or sign in again.
      </div>
    </DashboardShell>
  );
}

export default function InstitutionDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Institution Dashboard...</div>}>
      <InstitutionDashboardContent />
    </Suspense>
  );
}
