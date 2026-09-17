import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  Compass,
  CheckCircle2,
  Plus,
} from "lucide-react";

async function SuperAdminDashboardContent() {
  const { user, profile } = await requireSuperAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let metricsData: any = {};
  let recentOpportunities: any[] = [];
  let recentApplications: any[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        data: {
          metrics: any;
          recentOpportunities: any[];
          recentApplications: any[];
        };
      }>("/super-admin/dashboard", {
        headers: { Cookie: `auth_token=${token}` },
      });

      if (res?.data) {
        metricsData = res.data.metrics || {};
        recentOpportunities = (res.data.recentOpportunities || []).map((o: any) => ({
          ...o,
          organizations: { name: o.organizationName },
        }));
        recentApplications = (res.data.recentApplications || []).map((a: any) => ({
          ...a,
          student: { full_name: a.studentName },
          opportunity: { title: a.opportunityTitle },
        }));
      }
    } catch {
      // Fallback to empty metrics
    }
  }

  const {
    totalStudents = 0,
    totalFaculty = 0,
    totalInstitutions = 0,
    totalOrganizations = 0,
    publishedOpportunities = 0,
    totalApplications = 0,
    selectedCandidates = 0,
    activePlacements = 0,
  } = metricsData;

  const metrics = [
    {
      title: "Total Students",
      value: totalStudents ?? 0,
      description: "Active enrolled scholars",
      icon: Users,
      href: "/super-admin/users",
      badge: "Scholars",
    },
    {
      title: "Total Faculty",
      value: totalFaculty ?? 0,
      description: "Mentors & researchers",
      icon: GraduationCap,
      href: "/super-admin/users",
      badge: "Mentors",
    },
    {
      title: "Institutions",
      value: totalInstitutions ?? 0,
      description: "Affiliated Ayurveda colleges",
      icon: Building2,
      href: "/super-admin/institutions",
      badge: "Academia",
    },
    {
      title: "Industries & Orgs",
      value: totalOrganizations ?? 0,
      description: "Industry partners",
      icon: Briefcase,
      href: "/super-admin/industries",
      badge: "Industry",
    },
    {
      title: "Published Opportunities",
      value: publishedOpportunities ?? 0,
      description: "Active listings",
      icon: Compass,
      href: "/super-admin/opportunities",
      badge: "Live",
    },
    {
      title: "Total Applications",
      value: totalApplications ?? 0,
      description: "Student submissions",
      icon: FileCheck2,
      href: "/super-admin/analytics",
      badge: "Submissions",
    },
    {
      title: "Selected Candidates",
      value: selectedCandidates ?? 0,
      description: "Matched & accepted",
      icon: CheckCircle2,
      href: "/super-admin/analytics",
      badge: "Matched",
    },
    {
      title: "Active Placements",
      value: activePlacements ?? 0,
      description: "Joined & in progress",
      icon: Award,
      href: "/super-admin/analytics",
      badge: "Ongoing",
    },
  ];

  return (
    <DashboardShell
      userRole="super_admin"
      userName={profile.full_name || "Super Admin"}
      userEmail={profile.email}
      breadcrumbs={[
        { label: "Super Admin", href: "/super-admin/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl border border-ayush-border/80 bg-gradient-to-r from-ayush-brown to-ayush-brown/95 p-6 sm:p-8 text-ayush-card shadow-warm-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
            <ShieldCheck className="w-80 h-80 text-white" />
          </div>
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-ayush-saffron animate-pulse" />
              <span className="text-xs uppercase tracking-wider text-ayush-saffron font-semibold">
                Super Admin Control Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              AYUSH Platform Governance & Analytics
            </h1>
            <p className="text-sm text-ayush-sand/80 leading-relaxed">
              Real-time administrative visibility across affiliated institutions, industrial organizations,
              enrolled scholars, and professional career transitions.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                href="/super-admin/institutions?action=add"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ayush-saffron text-ayush-dark hover:bg-ayush-saffron/90 font-semibold text-xs shadow-warm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Institution</span>
              </Link>
              <Link
                href="/super-admin/industries?action=add"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Industry</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 8 Primary Platform Metrics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-heading font-semibold text-ayush-dark">
              Platform-Wide Key Indicators
            </h2>
            <span className="text-xs text-ayush-muted">Live telemetry</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.title} href={m.href} className="group">
                  <Card className="h-full border-ayush-border/80 bg-ayush-card shadow-warm hover:shadow-warm-md hover:border-ayush-brown/50 transition-all">
                    <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
                      <span className="text-xs font-medium text-ayush-muted">{m.title}</span>
                      <div className="h-8 w-8 rounded-lg bg-ayush-sand/50 text-ayush-brown flex items-center justify-center group-hover:bg-ayush-brown group-hover:text-ayush-card transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold font-heading text-ayush-dark">
                        {m.value}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ayush-muted">{m.description}</span>
                        <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-ayush-sand text-ayush-brown">
                          {m.badge}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Two Column Section: Recent Opportunities & Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Opportunities */}
          <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Recent Opportunities
                </CardTitle>
                <CardDescription className="text-xs text-ayush-muted">
                  Latest postings across industries and institutions
                </CardDescription>
              </div>
              <Link
                href="/super-admin/opportunities"
                className="text-xs font-semibold text-ayush-brown hover:text-ayush-saffron flex items-center gap-1 transition-colors"
              >
                <span>Manage all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOpportunities && recentOpportunities.length > 0 ? (
                recentOpportunities.map((opp: any) => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-ayush-border/60 bg-ayush-sand/20 hover:bg-ayush-sand/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-semibold text-xs text-ayush-dark truncate">
                        {opp.title}
                      </div>
                      <div className="text-[11px] text-ayush-muted mt-0.5">
                        {opp.organizations?.name || "AYUSH Organization"} •{" "}
                        <span className="capitalize">{opp.opportunity_type}</span>
                      </div>
                    </div>
                    <Badge
                      variant={opp.status === "published" ? "herbal" : "default"}
                      className="text-[10px] py-0 px-2 uppercase shrink-0"
                    >
                      {opp.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-ayush-muted">
                  No opportunities created yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Student Applications */}
          <Card className="border-ayush-border/80 bg-ayush-card shadow-warm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  Recent Applications
                </CardTitle>
                <CardDescription className="text-xs text-ayush-muted">
                  Incoming student submissions across opportunities
                </CardDescription>
              </div>
              <Link
                href="/super-admin/analytics"
                className="text-xs font-semibold text-ayush-brown hover:text-ayush-saffron flex items-center gap-1 transition-colors"
              >
                <span>View analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentApplications && recentApplications.length > 0 ? (
                recentApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-ayush-border/60 bg-ayush-sand/20 hover:bg-ayush-sand/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-semibold text-xs text-ayush-dark truncate">
                        {app.student?.full_name || "Scholar Candidate"}
                      </div>
                      <div className="text-[11px] text-ayush-muted mt-0.5 truncate">
                        Applied for: {app.opportunity?.title || "Opportunity"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        app.status === "selected"
                          ? "herbal"
                          : app.status === "rejected"
                          ? "destructive"
                          : "saffron"
                      }
                      className="text-[10px] py-0 px-2 uppercase shrink-0"
                    >
                      {app.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-ayush-muted">
                  No applications submitted yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/super-admin/institutions"
            className="p-4 rounded-xl border border-ayush-border/80 bg-ayush-card hover:bg-ayush-sand/30 shadow-warm transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-ayush-brown" />
              <div>
                <div className="text-xs font-semibold text-ayush-dark">Manage Institutions</div>
                <div className="text-[11px] text-ayush-muted">Approvals & status</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-ayush-muted" />
          </Link>

          <Link
            href="/super-admin/industries"
            className="p-4 rounded-xl border border-ayush-border/80 bg-ayush-card hover:bg-ayush-sand/30 shadow-warm transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-ayush-green" />
              <div>
                <div className="text-xs font-semibold text-ayush-dark">Manage Industries</div>
                <div className="text-[11px] text-ayush-muted">Partner organizations</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-ayush-muted" />
          </Link>

          <Link
            href="/super-admin/users"
            className="p-4 rounded-xl border border-ayush-border/80 bg-ayush-card hover:bg-ayush-sand/30 shadow-warm transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-ayush-terracotta" />
              <div>
                <div className="text-xs font-semibold text-ayush-dark">Manage Users</div>
                <div className="text-[11px] text-ayush-muted">Role governance</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-ayush-muted" />
          </Link>

          <Link
            href="/super-admin/analytics"
            className="p-4 rounded-xl border border-ayush-border/80 bg-ayush-card hover:bg-ayush-sand/30 shadow-warm transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-ayush-saffron" />
              <div>
                <div className="text-xs font-semibold text-ayush-dark">Platform Analytics</div>
                <div className="text-[11px] text-ayush-muted">Competency & outcomes</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-ayush-muted" />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Loading Super Admin Control Center...
          </div>
        </div>
      }
    >
      <SuperAdminDashboardContent />
    </Suspense>
  );
}
