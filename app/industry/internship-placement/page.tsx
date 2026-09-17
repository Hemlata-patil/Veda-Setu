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
  Users,
  CheckCircle2,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PlacementTrackingModal } from "./tracking-modal";

export const metadata = {
  title: "Candidate Engagement & Placement Tracking — Industry Portal",
  description: "Track candidate onboarding, progression, and internship outcomes",
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

import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

async function IndustryPlacementContent() {
  const { user, profile } = await requireRole("industry");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let candidateList: any[] = [];

  try {
    const res = await apiFetch<{ status: string; results: number; data: any[] }>(
      "/placements/industry?includeUnplaced=true",
      {
        headers: token ? { Cookie: `auth_token=${token}` } : undefined,
      }
    );

    candidateList = (res.data || []).map((item: any) => {
      const opp = item.opportunity;
      const student = item.student
        ? {
            id: item.student.id,
            full_name: item.student.fullName,
            email: item.student.email,
            program: item.student.program,
            year: item.student.year,
            department: item.student.department,
          }
        : null;

      const institution = item.student?.institutionName
        ? {
            name: item.student.institutionName,
            code: item.student.institutionCode,
          }
        : null;

      const placement = item.id
        ? {
            id: item.id,
            engagement_type: item.engagementType,
            status: item.status,
            start_date: item.startDate,
            expected_end_date: item.expectedEndDate,
            actual_end_date: item.actualEndDate,
            progress_percent: item.progressPercent,
            supervisor_name: item.supervisorName,
            supervisor_email: item.supervisorEmail,
            outcome: item.outcome,
            updated_at: item.updatedAt,
          }
        : null;

      const suggestedType: "internship" | "placement" =
        opp?.opportunity_type === "entry_level_job" ? "placement" : "internship";

      return {
        applicationId: item.applicationId,
        student,
        institution,
        opportunity: opp
          ? {
              id: opp.id,
              title: opp.title,
              opportunity_type: opp.opportunityType || opp.opportunity_type,
            }
          : null,
        placement,
        suggestedType,
      };
    });
  } catch (err) {
    candidateList = [];
  }

  return (
    <DashboardShell
      userRole="industry"
      userName={profile?.full_name || "Industry Partner"}
      userEmail={user.email || ""}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Industry Dashboard", href: "/industry/dashboard" },
        { label: "Internship & Placement" },
      ]}
    >
      <PageHeader
        eyebrow="Post-Selection Lifecycle"
        eyebrowColor="green"
        title="Candidate Engagement & Placement Tracking"
        description="Oversee candidates selected from your posted opportunities. Initialize tracking, manage joining schedules, monitor progress, and finalize engagement outcomes."
        actions={
          <Badge variant="outline" className="text-xs">
            {candidateList.length} Selected Candidates
          </Badge>
        }
      />

      {candidateList.length === 0 ? (
        <Card className="border-dashed border-ayush-parchment/40 bg-ayush-parchment/5">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-ayush-herbal/10 text-ayush-herbal mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-ayush-text">
                No Selected Candidates Yet
              </h3>
              <p className="text-sm text-ayush-text-muted max-w-md mx-auto">
                Once you review applicants and mark a candidate as &quot;Selected&quot;, they will appear here to begin formal onboarding and progress tracking.
              </p>
            </div>
            <Button asChild variant="default" size="sm">
              <Link href="/industry/applications">Review Candidate Applications</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidateList.map((item) => {
            const placement = item.placement;
            const statusCfg = placement
              ? STATUS_CONFIG[placement.status] || { label: placement.status, badgeVariant: "secondary" as const }
              : null;
            const progress = Number(placement?.progress_percent) || 0;

            return (
              <Card
                key={item.applicationId}
                className="border-ayush-parchment/30 bg-card hover:border-ayush-herbal/40 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-serif font-bold text-ayush-text">
                          {item.student?.full_name || "Candidate"}
                        </h3>
                        {placement ? (
                          <>
                            <Badge variant={statusCfg?.badgeVariant} className="text-xs capitalize">
                              {statusCfg?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs uppercase font-mono">
                              {placement.engagement_type}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="saffron" className="text-xs">
                            Selection Finalized • Ready to Track
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-ayush-text-muted flex flex-wrap items-center gap-3">
                        <span className="text-ayush-text font-medium">
                          {item.opportunity?.title}
                        </span>
                        {item.institution?.name && (
                          <span className="flex items-center gap-1 text-ayush-teal">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{item.institution.name}</span>
                          </span>
                        )}
                        {item.student?.email && (
                          <span>{item.student.email}</span>
                        )}
                      </div>

                      {placement && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-ayush-text-muted">
                              Engagement Progress: <strong className="text-ayush-text">{progress}%</strong>
                            </span>
                            {placement.start_date && (
                              <span className="text-ayush-text-muted">
                                Start: {new Date(placement.start_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-ayush-parchment/20 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-ayush-herbal h-full rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 self-end lg:self-center">
                      <PlacementTrackingModal
                        applicationId={item.applicationId}
                        studentName={item.student?.full_name || "Candidate"}
                        opportunityTitle={item.opportunity?.title || "Opportunity"}
                        suggestedType={item.suggestedType}
                        placement={placement}
                      />
                    </div>
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

export default function IndustryPlacementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Candidates...</div>}>
      <IndustryPlacementContent />
    </Suspense>
  );
}
