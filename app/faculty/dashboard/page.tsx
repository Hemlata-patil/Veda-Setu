import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildStudentSkillProfile } from "@/lib/competencies";
import {
  Users,
  Award,
  GraduationCap,
  ArrowUpRight,
  User,
  AlertCircle,
  Building2,
  Sparkles,
  BookOpen,
  Microscope,
  FileCheck2,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Faculty Dashboard — VEDA SETU",
  description: "Ayush faculty and academic mentorship portal",
};

async function FacultyDashboardContent() {
  const { user, profile } = await requireRole("faculty");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // 1. Authoritative Express REST API query
  const dashRes = await apiFetch<{
    status: string;
    data: {
      faculty: {
        id: string;
        fullName: string;
        email: string;
        department: string | null;
        designation: string | null;
      };
      institution: {
        id: string;
        name: string;
        code: string | null;
        location: string | null;
      } | null;
      metrics: {
        cohortStudentCount: number;
        assessedStudentsCount: number;
        averageCohortScore: number | null;
          activeStudentPlacementsCount?: number;
          inProgressPlacementsCount?: number;
        };
        recentStudents: Array<{
          id: string;
          fullName: string;
          email: string;
          program: string | null;
          year: number | null;
          overallScore: number | null;
        }>;
      };
    }>("/faculty/dashboard", {
      headers: { Cookie: `auth_token=${token}` },
    });

    const dashData = dashRes.data;

    // If faculty has no institution affiliated
    if (!dashData.institution) {
      return (
        <DashboardShell
          userRole="faculty"
          userName={dashData.faculty?.fullName || profile?.full_name || "Faculty Member"}
          userEmail={dashData.faculty?.email || user.email || "faculty@institution.edu.in"}
          breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Faculty Dashboard" }]}
        >
          <PageHeader
            eyebrow="Faculty Portal"
            eyebrowColor="saffron"
            title={`Welcome, ${dashData.faculty?.fullName || profile?.full_name || "Faculty Member"}`}
            description="Faculty development, student case endorsement, and institutional mentorship."
          />

          <div className="p-6 rounded-xl bg-ayush-parchment/10 border border-ayush-parchment/30 mb-8">
            <div className="flex items-start gap-4">
              <span className="p-3 rounded-lg bg-ayush-parchment/20 text-ayush-saffron shrink-0">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div className="space-y-2">
                <h3 className="text-base font-medium text-ayush-text">
                  Institutional Affiliation Required
                </h3>
                <p className="text-sm text-ayush-text-muted leading-relaxed">
                  Your profile is not currently affiliated with an academic institution. Institutional affiliation
                  is required to monitor student competencies, view class cohorts, and initiate 1-on-1 mentorship.
                </p>
                <div className="pt-2">
                  <Button asChild size="sm" variant="saffron">
                    <Link href="/profile">Update Profile & Affiliation</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DashboardShell>
      );
    }

    const institution = dashData.institution;
    const cohortStudentCount = dashData.metrics.cohortStudentCount;
    const assessedStudentsCount = dashData.metrics.assessedStudentsCount;
    const averageScore = dashData.metrics.averageCohortScore;

    // 2. Fetch Mentorship statistics
    const mentorRes = await apiFetch<{
      status: string;
      data: {
        activeMentees: any[];
        pendingRequests: any[];
        completedMentees: any[];
      };
    }>("/mentorship/faculty", {
      headers: { Cookie: `auth_token=${token}` },
    });

    const activeMentees = mentorRes.data?.activeMentees || [];
    const pendingRequests = mentorRes.data?.pendingRequests || [];
    const completedMentees = mentorRes.data?.completedMentees || [];
    const activeMentorshipsCount = activeMentees.length;
    const pendingRequestsCount = pendingRequests.length;

    const recentMenteeRecords = [...activeMentees, ...completedMentees].slice(0, 4).map((m: any) => ({
      id: m.id,
      student_id: m.studentId,
      studentName: m.studentName || "Ayush Scholar",
      mentor_note: m.mentorNote,
      overallScore: m.overallScore ?? null,
      status: m.status,
    }));

    // 3. Fetch Collaboration statistics
    const [collabRes, interestsRes] = await Promise.all([
      apiFetch<{ status: string; data: any[] }>("/faculty-collaboration", {
        headers: { Cookie: `auth_token=${token}` },
      }),
      apiFetch<{ status: string; data: any[] }>("/faculty-collaboration/interests/my-interests", {
        headers: { Cookie: `auth_token=${token}` },
      }),
    ]);

    const publishedOppCount = (collabRes.data || []).filter((o: any) => o.status === "published").length;
    const myInterests = interestsRes.data || [];
    const myInterestsCount = myInterests.length;
    const acceptedCollabsCount = myInterests.filter((i: any) => i.status === "accepted").length;

    // 4. Student Placement Progress
    const activeStudentPlacementsCount = dashData.metrics.activeStudentPlacementsCount || 0;
    const inProgressPlacementsCount = dashData.metrics.inProgressPlacementsCount || 0;

    return (
      <DashboardShell
        userRole="faculty"
        userName={dashData.faculty?.fullName || profile?.full_name || "Faculty Mentor"}
        userEmail={dashData.faculty?.email || user.email || "faculty@institution.edu.in"}
        breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Faculty Dashboard" }]}
      >
        <PageHeader
          eyebrow="Academic Mentorship Portal"
          eyebrowColor="saffron"
          title={`Welcome, ${dashData.faculty?.fullName || profile?.full_name || "Faculty Mentor"}`}
          description="Monitor student clinical competencies, document case guidance, and oversee departmental academic performance."
          actions={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                <Link href="/faculty/collaboration">
                  <Microscope className="w-3.5 h-3.5" />
                  <span>FDP & Research</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="saffron" className="gap-1.5 text-xs">
                <Link href="/faculty/students">
                  <Users className="w-3.5 h-3.5" />
                  <span>Browse Student Cohort</span>
                </Link>
              </Button>
            </div>
          }
        />

        {/* Institution Info Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-8 rounded-xl bg-ayush-surface-raised border border-ayush-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ayush-surface border border-ayush-border text-ayush-saffron">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-ayush-text">{institution.name}</h4>
                <Badge variant="herbal">Affiliated Institution</Badge>
              </div>
              <p className="text-xs text-ayush-muted mt-0.5">
                {institution.code ? `${institution.code} • ` : ""}{institution.location || "Affiliated Campus"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-ayush-muted">
            <div>
              <span>Enrolled Students:</span>
              <strong className="ml-1 text-ayush-text font-serif text-sm">{cohortStudentCount}</strong>
            </div>
            <div>
              <span>Assessed Cohort:</span>
              <strong className="ml-1 text-ayush-text font-serif text-sm">{assessedStudentsCount}</strong>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card accent="saffron">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                  Cohort Students
                </CardTitle>
                <Users className="w-4 h-4 text-ayush-saffron" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-ayush-text">
                {cohortStudentCount}
              </div>
              <p className="text-xs text-ayush-muted mt-1">
                Enrolled under {institution.name}
              </p>
            </CardContent>
          </Card>

          <Card accent="green">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                  Average Score
                </CardTitle>
                <Award className="w-4 h-4 text-ayush-herbal" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-ayush-text">
                {averageScore !== null ? `${averageScore}%` : "—"}
              </div>
              <p className="text-xs text-ayush-muted mt-1">
                {assessedStudentsCount} assessed of {cohortStudentCount} total
              </p>
            </CardContent>
          </Card>

          <Card accent="saffron">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                  Active Mentorships
                </CardTitle>
                <GraduationCap className="w-4 h-4 text-ayush-saffron" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-ayush-text">
                {activeMentorshipsCount}
              </div>
              <p className="text-xs text-ayush-muted mt-1">
                1-on-1 clinical & academic guidance
              </p>
            </CardContent>
          </Card>

          <Card accent="green">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
                  Pending Requests
                </CardTitle>
                <MessageSquare className="w-4 h-4 text-ayush-herbal" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-ayush-text">
                {pendingRequestsCount}
              </div>
              <p className="text-xs text-ayush-muted mt-1">
                Awaiting your faculty review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Section: Mentee Pipeline & Guidance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Recent Assigned Mentees */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-ayush-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Mentees & Guidance Status</CardTitle>
                    <p className="text-xs text-ayush-muted mt-0.5">
                      Recent students assigned to your academic mentorship queue
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="gap-1 text-xs">
                    <Link href="/faculty/mentorship">
                      <span>All Mentorships</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {recentMenteeRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-ayush-muted mb-3">
                      No active or historical mentorship records yet.
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/faculty/students" className="gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>Browse Institution Students</span>
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMenteeRecords.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-ayush-surface-raised border border-ayush-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-ayush-surface flex items-center justify-center border border-ayush-border text-ayush-muted">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ayush-text">{m.studentName}</p>
                            <p className="text-xs text-ayush-muted truncate max-w-[280px]">
                              {m.mentor_note || "No notes entered."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {m.overallScore !== null ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ayush-surface border border-ayush-border">
                              {m.overallScore}%
                            </span>
                          ) : (
                            <Badge variant="parchment">Pending</Badge>
                          )}

                          <Badge variant={m.status === "active" ? "saffron" : "herbal"}>
                            {m.status === "active" ? "Active" : "Completed"}
                          </Badge>

                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/faculty/students/${m.student_id}`}>
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Guidance Overview */}
          <div className="space-y-6">
            <Card accent="green">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-ayush-herbal" />
                  <span>Academic Supervision</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-ayush-text-muted leading-relaxed">
                <p>
                  As an Ayush faculty mentor, you have direct access to your institution&apos;s student competency
                  profiles.
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Review standardized competency benchmarks</li>
                  <li>Identify clinical diagnostic & practical gaps</li>
                  <li>Record 1-on-1 developmental notes</li>
                  <li>Guide research methodology & evidence-based Ayush practice</li>
                </ul>
                <div className="pt-2">
                  <Button asChild size="sm" variant="saffron" className="w-full">
                    <Link href="/faculty/students">View Institution Students</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FDP & Research Summary Section */}
            <Card accent="saffron">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-ayush-saffron" />
                    <span>FDP & Research</span>
                  </CardTitle>
                  <Badge variant="saffron" className="text-[10px]">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-ayush-parchment/15 border border-ayush-parchment/30">
                    <div className="text-lg font-bold font-serif text-ayush-text">
                      {publishedOppCount || 0}
                    </div>
                    <div className="text-[10px] text-ayush-text-muted mt-0.5">Available</div>
                  </div>

                  <div className="p-2 rounded-lg bg-ayush-parchment/15 border border-ayush-parchment/30">
                    <div className="text-lg font-bold font-serif text-ayush-saffron">
                      {myInterestsCount}
                    </div>
                    <div className="text-[10px] text-ayush-text-muted mt-0.5">My Interests</div>
                  </div>

                  <div className="p-2 rounded-lg bg-ayush-parchment/15 border border-ayush-parchment/30">
                    <div className="text-lg font-bold font-serif text-emerald-600">
                      {acceptedCollabsCount}
                    </div>
                    <div className="text-[10px] text-ayush-text-muted mt-0.5">Accepted</div>
                  </div>
                </div>

                <p className="text-ayush-text-muted leading-relaxed">
                  Discover accredited Faculty Development Programs, joint clinical trials, and industry research collaborations.
                </p>

                <div className="pt-1 flex items-center gap-2">
                  <Button asChild size="sm" variant="saffron" className="w-full text-xs">
                    <Link href="/faculty/collaboration">Browse Programs</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="w-full text-xs">
                    <Link href="/faculty/collaboration/interests">My Interests</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student Placement Progress Card (Shown only if data exists) */}
            {activeStudentPlacementsCount > 0 && (
              <Card accent="green">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-ayush-herbal" />
                      <span>Student Placement Progress</span>
                    </CardTitle>
                    <Badge variant="herbal" className="text-[10px]">
                      {activeStudentPlacementsCount} Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-ayush-parchment/15 border border-ayush-parchment/30">
                    <span className="text-ayush-text-muted">In Progress / Joined:</span>
                    <strong className="text-ayush-text font-serif text-sm">{inProgressPlacementsCount} Students</strong>
                  </div>
                  <p className="text-ayush-text-muted leading-relaxed">
                    Scholars from your institution are currently undergoing industry internships and career placements. View individual progress on student profiles.
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full text-xs">
                    <Link href="/faculty/students">View Enrolled Students</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardShell>
  );
}

export default function FacultyDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Faculty Dashboard...</div>}>
      <FacultyDashboardContent />
    </Suspense>
  );
}
