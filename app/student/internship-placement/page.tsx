import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export const metadata = {
  title: "Internship & Placement — Student Portal",
  description: "Track your active internship or career placement onboarding and progress",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeVariant: "saffron" | "herbal" | "secondary" | "destructive" | "default" | "outline" }
> = {
  selected: { label: "Selected", badgeVariant: "saffron" },
  offer_accepted: { label: "Offer Accepted", badgeVariant: "herbal" },
  joined: { label: "Joined", badgeVariant: "herbal" },
  in_progress: { label: "In Progress", badgeVariant: "saffron" },
  completed: { label: "Completed", badgeVariant: "herbal" },
  withdrawn: { label: "Withdrawn", badgeVariant: "destructive" },
};

async function StudentPlacementContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let placementList: any[] = [];

  if (token) {
    try {
      const res = await apiFetch<{ status: string; results: number; data: any[] }>(
        "/placements/student",
        {
          headers: { Cookie: `auth_token=${token}` },
        }
      );

      placementList = (res.data || []).map((p: any) => ({
        id: p.id,
        engagement_type: p.engagementType,
        status: p.status,
        start_date: p.startDate,
        expected_end_date: p.expectedEndDate,
        actual_end_date: p.actualEndDate,
        progress_percent: p.progressPercent,
        supervisor_name: p.supervisorName,
        supervisor_email: p.supervisorEmail,
        outcome: p.outcome,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
        opportunity: p.opportunity
          ? {
              id: p.opportunity.id,
              title: p.opportunity.title,
              opportunity_type: p.opportunity.opportunityType || p.opportunity.opportunity_type,
              location: p.opportunity.location,
              mode: p.opportunity.mode,
            }
          : null,
        organization: p.organization
          ? {
              id: p.organization.id,
              name: p.organization.name,
              organization_type: p.organization.organizationType || p.organization.organization_type,
            }
          : null,
      }));
    } catch (err) {
      console.error("Error fetching student placement data:", err);
      placementList = [];
    }
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || ""}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "Internship & Placement" },
      ]}
    >
      <PageHeader
        eyebrow="Industry Engagement"
        eyebrowColor="saffron"
        title="Internship & Placement Tracking"
        description="Monitor your official onboarding status, internship progression milestones, and post-selection placement outcomes."
      />

      {placementList.length === 0 ? (
        <Card className="border-dashed border-ayush-parchment/40 bg-ayush-parchment/5">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-ayush-saffron/10 text-ayush-saffron mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-ayush-text">
                No Active Internship or Placement Yet
              </h3>
              <p className="text-sm text-ayush-text-muted max-w-md mx-auto">
                Once an industry partner selects your application and initiates tracking, your engagement roadmap, onboarding steps, and progress will be shown here.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/student/applications">View My Applications</Link>
              </Button>
              <Button asChild variant="saffron" size="sm">
                <Link href="/student/opportunities">Explore Opportunities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {placementList.map((placement) => {
            const statusCfg = STATUS_CONFIG[placement.status] || {
              label: placement.status,
              badgeVariant: "secondary" as const,
            };
            const percent = Number(placement.progress_percent) || 0;

            return (
              <Card
                key={placement.id}
                className="border-ayush-parchment/30 bg-card hover:border-ayush-saffron/30 transition-all"
              >
                <CardHeader className="p-6 pb-4 border-b border-ayush-parchment/20">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusCfg.badgeVariant} className="text-xs capitalize">
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
                          {placement.engagement_type}
                        </Badge>
                        {placement.opportunity?.mode && (
                          <Badge variant="parchment" className="text-xs capitalize">
                            {placement.opportunity.mode}
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-xl font-serif font-bold text-ayush-text">
                        {placement.opportunity?.title || "Industry Opportunity"}
                      </CardTitle>

                      {placement.organization?.name && (
                        <p className="text-xs text-ayush-teal font-medium flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{placement.organization.name}</span>
                          {placement.organization.location && (
                            <span className="text-ayush-text-muted font-normal">
                              • {placement.organization.location}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-serif font-bold text-ayush-text">{percent}%</span>
                      <p className="text-[11px] text-ayush-text-muted">Progress Completed</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-ayush-parchment/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-ayush-saffron h-full transition-all duration-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Timeline */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-ayush-text uppercase tracking-wider text-[11px]">
                      Timeline & Schedule
                    </h4>
                    <div className="space-y-1.5 text-ayush-text-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-ayush-saffron shrink-0" />
                        <span>
                          Start Date:{" "}
                          <span className="text-ayush-text font-medium">
                            {placement.start_date
                              ? new Date(placement.start_date).toLocaleDateString()
                              : "Pending scheduling"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-ayush-teal shrink-0" />
                        <span>
                          Expected End:{" "}
                          <span className="text-ayush-text font-medium">
                            {placement.expected_end_date
                              ? new Date(placement.expected_end_date).toLocaleDateString()
                              : "Not specified"}
                          </span>
                        </span>
                      </div>
                      {placement.actual_end_date && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Completed On:{" "}
                            <span className="text-emerald-700 font-medium">
                              {new Date(placement.actual_end_date).toLocaleDateString()}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Industry Supervisor */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-ayush-text uppercase tracking-wider text-[11px]">
                      Industry Supervisor
                    </h4>
                    <div className="space-y-1.5 text-ayush-text-muted">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-ayush-text-muted shrink-0" />
                        <span className="text-ayush-text font-medium">
                          {placement.supervisor_name || "Supervisor assigned upon joining"}
                        </span>
                      </div>
                      {placement.supervisor_email && (
                        <p className="text-ayush-text-muted pl-5">{placement.supervisor_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Outcome / Notes */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-ayush-text uppercase tracking-wider text-[11px]">
                      Outcome & Feedback
                    </h4>
                    {placement.outcome ? (
                      <p className="text-ayush-text bg-ayush-parchment/15 border border-ayush-parchment/30 p-2.5 rounded leading-relaxed">
                        {placement.outcome}
                      </p>
                    ) : (
                      <p className="text-ayush-text-muted italic">
                        No final evaluation recorded yet. Feedback and completion credentials will appear here at the end of engagement.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

export default function StudentPlacementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Placement Details...</div>}>
      <StudentPlacementContent />
    </Suspense>
  );
}
