import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
} from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Internship & Placement Outcomes — Institutional Oversight",
  description: "Aggregated placement and internship tracking across enrolled student cohorts",
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

interface ExpressPlacementItem {
  id: string;
  engagementType: string;
  status: string;
  startDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  progressPercent: number | null;
  supervisorName: string | null;
  outcome: string | null;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    program: string | null;
    year: number | null;
  } | null;
  opportunity: {
    id: string;
    title: string;
    opportunityType: string;
  } | null;
  organization: {
    id: string;
    name: string;
    organizationType: string;
  } | null;
}

function PlacementList({ placements }: { placements: ExpressPlacementItem[] }) {
  const totalSelected = placements.filter((p) => p.status === "selected").length;
  const totalJoined = placements.filter((p) => ["joined", "in_progress", "completed"].includes(p.status)).length;
  const totalInProgress = placements.filter((p) => p.status === "in_progress").length;
  const totalCompleted = placements.filter((p) => p.status === "completed").length;

  return (
    <>
      {/* Aggregate Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card accent="saffron">
          <CardHeader className="pb-1 pt-4 px-4">
            <span className="text-xs text-ayush-muted uppercase tracking-wider font-semibold">Total Selected</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold font-serif text-ayush-text">{totalSelected}</span>
            <p className="text-[11px] text-ayush-muted mt-1">Awaiting engagement onboarding</p>
          </CardContent>
        </Card>

        <Card accent="green">
          <CardHeader className="pb-1 pt-4 px-4">
            <span className="text-xs text-ayush-muted uppercase tracking-wider font-semibold">Active Joined</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold font-serif text-ayush-green">{totalJoined}</span>
            <p className="text-[11px] text-ayush-muted mt-1">Confirmed student positions</p>
          </CardContent>
        </Card>

        <Card accent="brown">
          <CardHeader className="pb-1 pt-4 px-4">
            <span className="text-xs text-ayush-muted uppercase tracking-wider font-semibold">In Progress</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold font-serif text-ayush-brown">{totalInProgress}</span>
            <p className="text-[11px] text-ayush-muted mt-1">Tenures actively ongoing</p>
          </CardContent>
        </Card>

        <Card accent="green">
          <CardHeader className="pb-1 pt-4 px-4">
            <span className="text-xs text-ayush-muted uppercase tracking-wider font-semibold">Completed</span>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <span className="text-3xl font-bold font-serif text-ayush-teal">{totalCompleted}</span>
            <p className="text-[11px] text-ayush-muted mt-1">Successfully fulfilled tenures</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Engagements Listing */}
      {placements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-ayush-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold text-ayush-text mb-2">No Active Placement Records</h3>
            <p className="text-sm text-ayush-muted max-w-md mx-auto">
              When students from your institution are selected for internships or industry opportunities, their engagement status, tenures, and milestones will be tracked here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Enrolled Student Placements &amp; Apprenticeships</CardTitle>
            <p className="text-xs text-ayush-muted">Live lifecycle tracking of enterprise selections across all campus cohorts</p>
          </CardHeader>
          <CardContent className="divide-y divide-ayush-border/40 p-0">
            {placements.map((p) => {
              const statusCfg = STATUS_CONFIG[p.status] || { label: p.status, badgeVariant: "default" as const };
              const progress = p.progressPercent ?? (p.status === "completed" ? 100 : p.status === "joined" ? 10 : 0);

              return (
                <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-ayush-text">{p.student?.fullName || "Scholar Candidate"}</span>
                      {p.student?.program && (
                        <Badge variant="default" className="text-[10px]">
                          {p.student.program} {p.student.year ? `· Year ${p.student.year}` : ""}
                        </Badge>
                      )}
                      <Badge variant={statusCfg.badgeVariant} className="text-[10px]">
                        {statusCfg.label}
                      </Badge>
                    </div>

                    <p className="text-xs text-ayush-muted">
                      <span className="font-medium text-ayush-text">{p.opportunity?.title || "Industry Opportunity"}</span>
                      {p.organization?.name && <span> &bull; {p.organization.name}</span>}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-ayush-muted flex-wrap pt-0.5">
                      {p.startDate && <span>Started: {new Date(p.startDate).toLocaleDateString()}</span>}
                      {p.expectedEndDate && <span>Expected End: {new Date(p.expectedEndDate).toLocaleDateString()}</span>}
                      {p.supervisorName && <span>Supervisor: {p.supervisorName}</span>}
                      {p.outcome && <span className="text-ayush-text font-medium">Outcome: {p.outcome}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 text-right md:w-32">
                    <span className="text-sm font-bold text-ayush-text">{progress}% Progress</span>
                    <div className="w-24 bg-ayush-parchment/20 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-ayush-saffron h-full rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}

async function InstitutionPlacementContent() {
  const { user, profile } = await requireRole("institution");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let placements: ExpressPlacementItem[] = [];

  try {
    const res = await apiFetch<{ status: string; data: { placements: ExpressPlacementItem[] } }>(
      "/institution/internship-placement",
      { headers: token ? { Cookie: `auth_token=${token}` } : undefined }
    );
    placements = res.data.placements || [];
  } catch (err: any) {
    // If endpoint fails or not affiliated, show empty state — don't crash
    placements = [];
  }

  return (
    <DashboardShell
      userRole="institution"
      userName={profile?.full_name || "Institution Admin"}
      userEmail={user.email || ""}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Institution Dashboard", href: "/institution/dashboard" },
        { label: "Internship & Placement" },
      ]}
    >
      <PageHeader
        eyebrow="Institutional Outcomes"
        eyebrowColor="saffron"
        title="Internship & Placement Oversight"
        description="Comprehensive tracking of enterprise selections, internship tenures, and career placements across your campus student body."
      />
      <PlacementList placements={placements} />
    </DashboardShell>
  );
}

export default function InstitutionPlacementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Placement Oversight...</div>}>
      <InstitutionPlacementContent />
    </Suspense>
  );
}
