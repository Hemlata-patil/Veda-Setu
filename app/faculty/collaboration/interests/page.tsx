import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck2,
  Building2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Microscope,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { WithdrawInterestButton } from "./withdraw-button";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export const metadata = {
  title: "My Submitted Interests — Faculty Collaboration",
};

async function FacultyInterestsContent() {
  const { user, profile } = await requireRole("faculty");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let interestList: any[] = [];

  try {
    const res = await apiFetch<{ status: string; data: any[] }>(
      "/faculty-collaboration/interests/my-interests",
      {
        headers: token ? { Cookie: `auth_token=${token}` } : undefined,
      }
    );

    interestList = (res.data || []).map((item: any) => ({
      id: item.id,
      status: item.status,
      message: item.message,
      created_at: item.createdAt || item.created_at,
      updated_at: item.updatedAt || item.updated_at,
      opportunity: item.opportunity
        ? {
            id: item.opportunity.id,
            title: item.opportunity.title,
            opportunity_type: item.opportunity.opportunityType || item.opportunity.opportunity_type,
            provider_name: item.opportunity.providerName || item.opportunity.provider_name,
            location: item.opportunity.location,
            mode: item.opportunity.mode,
            start_date: item.opportunity.startDate || item.opportunity.start_date,
            end_date: item.opportunity.endDate || item.opportunity.end_date,
            application_deadline: item.opportunity.applicationDeadline || item.opportunity.application_deadline,
            status: item.opportunity.status,
          }
        : null,
    }));
  } catch (err) {
    console.error("Error fetching faculty interests:", err);
  }

  return (
    <DashboardShell
      userRole="faculty"
      userName={profile?.full_name || "Faculty Member"}
      userEmail={user.email || "faculty@institution.edu.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Faculty Dashboard", href: "/faculty/dashboard" },
        { label: "FDP & Research", href: "/faculty/collaboration" },
        { label: "My Interests" },
      ]}
    >
      <PageHeader
        eyebrow="My Applications & Inquiries"
        eyebrowColor="saffron"
        title="Expressed Collaboration Interests"
        description="Track the status of your submissions to Faculty Development Programs, research projects, and collaborative initiatives."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/faculty/collaboration" className="flex items-center gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Browse All Opportunities</span>
            </Link>
          </Button>
        }
      />

      {interestList.length === 0 ? (
        <Card className="border-dashed border-ayush-parchment/40 bg-ayush-parchment/5">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-ayush-saffron/10 text-ayush-saffron mx-auto flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-ayush-text">No Interests Expressed Yet</h3>
              <p className="text-sm text-ayush-text-muted max-w-md mx-auto">
                Explore accredited FDPs, workshop opportunities, or research proposals and express your interest to initiate collaboration.
              </p>
            </div>
            <Button asChild variant="saffron" size="sm">
              <Link href="/faculty/collaboration">Discover Programs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interestList.map((item) => {
            const opp = item.opportunity;
            const canWithdraw = ["interested", "under_review"].includes(item.status);

            return (
              <Card key={item.id} className="border-ayush-parchment/30 bg-card hover:border-ayush-saffron/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="saffron" className="text-[10px] uppercase font-semibold">
                          {opp?.opportunity_type?.replace("_", " ") || "Opportunity"}
                        </Badge>
                        <Badge
                          variant={
                            item.status === "accepted"
                              ? "herbal"
                              : item.status === "rejected"
                              ? "destructive"
                              : item.status === "withdrawn"
                              ? "outline"
                              : "saffron"
                          }
                          className="text-xs capitalize font-medium"
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                        {opp?.mode && (
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {opp.mode}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-serif font-bold text-ayush-text">
                        {opp?.title || "Opportunity Details Unavailable"}
                      </h3>

                      {opp?.provider_name && (
                        <div className="flex items-center gap-1.5 text-xs text-ayush-teal font-medium">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{opp.provider_name}</span>
                        </div>
                      )}

                      {item.message && (
                        <p className="text-xs text-ayush-text-muted italic border-l-2 border-ayush-parchment/60 pl-2 mt-2">
                          "{item.message}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-ayush-text-muted pt-2">
                        <span>Submitted on: {new Date(item.created_at).toLocaleDateString()}</span>
                        {item.updated_at && item.updated_at !== item.created_at && (
                          <span>Last updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                      {canWithdraw && (
                        <WithdrawInterestButton interestId={item.id} />
                      )}
                      {opp?.id && (
                        <Button asChild size="sm" variant="outline" className="text-xs">
                          <Link href={`/faculty/collaboration/${opp.id}`} className="flex items-center gap-1">
                            <span>View Opportunity</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      )}
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

export default function FacultyInterestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading My Interests...</div>}>
      <FacultyInterestsContent />
    </Suspense>
  );
}
