import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  FileCheck2,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

async function PlatformAnalyticsContent() {
  const { profile } = await requireSuperAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let analyticsData: any = {};

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        data: any;
      }>("/super-admin/analytics", {
        headers: { Cookie: `auth_token=${token}` },
      });
      analyticsData = res?.data || {};
    } catch {
      analyticsData = {};
    }
  }

  const {
    students = {},
    skills = {},
    opportunities: opps = {},
    applications: apps = {},
    placements: plcs = {},
    institutions: insts = {},
    organizations: orgs = {},
    priorityDevelopmentAreas = [],
  } = analyticsData;

  const totalStudents = students.totalStudents ?? 0;
  const assessmentCompletionPct = students.assessmentCompletionPct ?? 0;
  const uniqueAssessedStudents = students.uniqueAssessedStudents ?? Math.round((assessmentCompletionPct * totalStudents) / 100);
  const overallAvgSkill = skills.overallAvgSkill ?? "0.0";
  const categoryScores = skills.categoryScores || {
    "Clinical Competence": { sum: 0, count: 0 },
    "Classical Knowledge": { sum: 0, count: 0 },
    "Research & Evidence": { sum: 0, count: 0 },
    "Professional & Integrative Practice": { sum: 0, count: 0 },
  };

  const oppStatusCounts = opps.oppStatusCounts || { published: 0, closed: 0, archived: 0, draft: 0 };
  const oppTypeCounts = opps.oppTypeCounts || {};

  const totalApps = apps.totalApps ?? 0;
  const appStatusCounts = apps.appStatusCounts || {
    submitted: 0,
    under_review: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0,
  };

  const placementStatusCounts = plcs.placementStatusCounts || {
    selected: appStatusCounts.selected || 0,
    offered: 0,
    joined: 0,
    in_progress: 0,
    completed: 0,
  };

  const totalInsts = insts.totalInsts ?? 0;
  const instStatusCounts = insts.instStatusCounts || { approved: 0, pending: 0, suspended: 0, rejected: 0 };

  const totalOrgs = orgs.totalOrgs ?? 0;
  const orgStatusCounts = orgs.orgStatusCounts || { approved: 0, pending: 0, suspended: 0, rejected: 0 };

  return (
    <DashboardShell
      userRole="super_admin"
      userName={profile.full_name || "Super Admin"}
      userEmail={profile.email}
      breadcrumbs={[
        { label: "Super Admin", href: "/super-admin/dashboard" },
        { label: "Platform Analytics" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ayush-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-ayush-brown" />
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-ayush-dark">
                Platform Analytics & Governance Aggregates
              </h1>
            </div>
            <p className="text-xs text-ayush-muted mt-1">
              Cross-cutting evaluation of student mastery, opportunity pipelines, and institutional approvals
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. Students & Skills Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Assessment Progress */}
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ayush-brown uppercase tracking-wider">
                    Student Cohort
                  </span>
                  <Badge variant="herbal" className="text-[10px]">Assessment Metric</Badge>
                </div>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Scholar Assessment Metrics
                </CardTitle>
                <CardDescription className="text-xs text-ayush-muted">
                  Standardized clinical & classical competency assessment status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-ayush-sand/30 border border-ayush-border/60 text-center">
                  <div>
                    <div className="text-2xl font-bold font-heading text-ayush-dark">{totalStudents}</div>
                    <div className="text-[11px] text-ayush-muted mt-0.5">Total Scholars</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-heading text-ayush-green">{uniqueAssessedStudents}</div>
                    <div className="text-[11px] text-ayush-muted mt-0.5">Assessed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-heading text-ayush-saffron">{assessmentCompletionPct}%</div>
                    <div className="text-[11px] text-ayush-muted mt-0.5">Completion Rate</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-ayush-muted">Cohort Assessment Progress</span>
                    <span className="font-semibold text-ayush-dark">{assessmentCompletionPct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-ayush-sand/60 overflow-hidden">
                    <div
                      className="h-full bg-ayush-green transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, assessmentCompletionPct))}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competency Category Averages */}
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ayush-saffron uppercase tracking-wider">
                    Competency Profile
                  </span>
                  <div className="text-xs font-semibold text-ayush-dark">
                    Platform Avg: <span className="text-ayush-brown font-bold">{overallAvgSkill}%</span>
                  </div>
                </div>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Four Domain Competency Profile
                </CardTitle>
                <CardDescription className="text-xs text-ayush-muted">
                  Aggregate skill performance across all evaluated students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(categoryScores).map(([cat, data]) => {
                  const catData = data as { count: number; sum: number };
                  const avg = catData?.count > 0 ? Math.round(catData.sum / catData.count) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ayush-dark truncate">{cat}</span>
                        <span className="font-bold text-ayush-brown">{avg}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-ayush-sand/60 overflow-hidden">
                        <div
                          className="h-full bg-ayush-brown transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, avg))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Priority Development Areas */}
          {priorityDevelopmentAreas.length > 0 && (
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-ayush-terracotta" />
                  <CardTitle className="text-sm font-heading font-bold text-ayush-dark">
                    Priority Curricular & Skill Development Focus Areas
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-ayush-muted">
                  Competencies with lowest aggregate mastery indicating nationwide training intervention opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {priorityDevelopmentAreas.map((p: any) => (
                    <div
                      key={p.name}
                      className="p-3 rounded-xl border border-ayush-terracotta/20 bg-ayush-terracotta/5 space-y-1"
                    >
                      <div className="text-[10px] text-ayush-terracotta font-semibold uppercase tracking-wider truncate">
                        {p.category}
                      </div>
                      <div className="font-semibold text-xs text-ayush-dark line-clamp-1">{p.name}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-ayush-muted">Current Avg:</span>
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                          {p.avg}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Opportunities & Applications Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Opportunities by Status & Type */}
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <span className="text-xs font-semibold text-ayush-green uppercase tracking-wider">
                  Market Supply
                </span>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Opportunities by Status & Type
                </CardTitle>
                <CardDescription className="text-xs text-ayush-muted">
                  Live, closed, and archived professional listings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-ayush-sand/30 border border-ayush-border/60">
                    <div className="text-lg font-bold text-ayush-green">{oppStatusCounts.published}</div>
                    <div className="text-[10px] text-ayush-muted">Published</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-sand/30 border border-ayush-border/60">
                    <div className="text-lg font-bold text-ayush-saffron">{oppStatusCounts.closed}</div>
                    <div className="text-[10px] text-ayush-muted">Closed</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-sand/30 border border-ayush-border/60">
                    <div className="text-lg font-bold text-ayush-terracotta">{oppStatusCounts.archived}</div>
                    <div className="text-[10px] text-ayush-muted">Archived</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-sand/30 border border-ayush-border/60">
                    <div className="text-lg font-bold text-ayush-dark">{oppStatusCounts.draft}</div>
                    <div className="text-[10px] text-ayush-muted">Draft</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-ayush-border/60 space-y-2">
                  <span className="text-xs font-semibold text-ayush-dark">Breakdown by Type:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["internship", "project", "research", "job"].map((type) => (
                      <div key={type} className="p-2 rounded-lg bg-ayush-sand/20 border border-ayush-border/50 text-xs">
                        <span className="text-ayush-muted capitalize">{type}:</span>
                        <span className="ml-1 font-bold text-ayush-dark">{oppTypeCounts[type] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications Lifecycle */}
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <span className="text-xs font-semibold text-ayush-saffron uppercase tracking-wider">
                  Talent Pipeline
                </span>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Candidate Applications Lifecycle
                </CardTitle>
                <CardDescription className="text-xs text-ayush-muted">
                  Total {totalApps} student submissions through review phases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ayush-muted">Under Review</span>
                    <span className="font-semibold text-ayush-dark">{appStatusCounts.under_review}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ayush-muted">Shortlisted</span>
                    <span className="font-semibold text-ayush-saffron">{appStatusCounts.shortlisted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ayush-muted">Selected / Offered</span>
                    <span className="font-semibold text-ayush-green">{appStatusCounts.selected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ayush-muted">Rejected / Closed</span>
                    <span className="font-semibold text-ayush-terracotta">{appStatusCounts.rejected}</span>
                  </div>
                </div>

                {/* Internship Placement Stages */}
                <div className="pt-3 border-t border-ayush-border/60">
                  <span className="text-xs font-semibold text-ayush-dark block mb-2">
                    Placement Execution:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-ayush-sand/20">
                      <div className="font-bold text-xs text-ayush-dark">{placementStatusCounts.selected}</div>
                      <div className="text-[10px] text-ayush-muted">Selected</div>
                    </div>
                    <div className="p-2 rounded-lg bg-ayush-sand/20">
                      <div className="font-bold text-xs text-ayush-green">{placementStatusCounts.joined}</div>
                      <div className="text-[10px] text-ayush-muted">Joined</div>
                    </div>
                    <div className="p-2 rounded-lg bg-ayush-sand/20">
                      <div className="font-bold text-xs text-ayush-saffron">{placementStatusCounts.in_progress}</div>
                      <div className="text-[10px] text-ayush-muted">In Progress</div>
                    </div>
                    <div className="p-2 rounded-lg bg-ayush-sand/20">
                      <div className="font-bold text-xs text-ayush-brown">{placementStatusCounts.completed}</div>
                      <div className="text-[10px] text-ayush-muted">Completed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Institutional & Industry Onboarding Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Institutions Status */}
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ayush-brown uppercase tracking-wider">
                    Academic Network
                  </span>
                  <Badge variant="default" className="text-[10px] bg-ayush-sand text-ayush-brown">
                    Total: {totalInsts}
                  </Badge>
                </div>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Institution Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-ayush-green/10 text-ayush-green border border-ayush-green/20">
                    <div className="text-base font-bold">{instStatusCounts.approved}</div>
                    <div className="text-[10px]">Approved</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-saffron/10 text-ayush-saffron border border-ayush-saffron/20">
                    <div className="text-base font-bold">{instStatusCounts.pending}</div>
                    <div className="text-[10px]">Pending</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-terracotta/10 text-ayush-terracotta border border-ayush-terracotta/20">
                    <div className="text-base font-bold">{instStatusCounts.suspended}</div>
                    <div className="text-[10px]">Suspended</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-sand/40 text-ayush-muted border border-ayush-border/60">
                    <div className="text-base font-bold">{instStatusCounts.rejected}</div>
                    <div className="text-[10px]">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizations Status */}
            <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ayush-green uppercase tracking-wider">
                    Industry Network
                  </span>
                  <Badge variant="default" className="text-[10px] bg-ayush-sand text-ayush-green">
                    Total: {totalOrgs}
                  </Badge>
                </div>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Organization Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-ayush-green/10 text-ayush-green border border-ayush-green/20">
                    <div className="text-base font-bold">{orgStatusCounts.approved}</div>
                    <div className="text-[10px]">Approved</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-saffron/10 text-ayush-saffron border border-ayush-saffron/20">
                    <div className="text-base font-bold">{orgStatusCounts.pending}</div>
                    <div className="text-[10px]">Pending</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-terracotta/10 text-ayush-terracotta border border-ayush-terracotta/20">
                    <div className="text-base font-bold">{orgStatusCounts.suspended}</div>
                    <div className="text-[10px]">Suspended</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-ayush-sand/40 text-ayush-muted border border-ayush-border/60">
                    <div className="text-base font-bold">{orgStatusCounts.rejected}</div>
                    <div className="text-[10px]">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function SuperAdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Loading Platform Analytics...
          </div>
        </div>
      }
    >
      <PlatformAnalyticsContent />
    </Suspense>
  );
}
