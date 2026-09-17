import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Microscope,
  BookOpen,
  Building2,
  Calendar,
  MapPin,
  ArrowUpRight,
  Sparkles,
  PlusCircle,
  FileCheck2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export const metadata = {
  title: "FDP & Research Collaboration — VEDA SETU",
  description: "Discover Faculty Development Programs, Research Initiatives, and Industry Collaborations",
};

interface CollaborationPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeVariant: "saffron" | "herbal" | "secondary" | "default" }
> = {
  fdp: { label: "Faculty Development Program", badgeVariant: "saffron" },
  workshop: { label: "Workshop & Training", badgeVariant: "default" },
  research_project: { label: "Research Project", badgeVariant: "herbal" },
  industry_collaboration: { label: "Industry Collaboration", badgeVariant: "secondary" },
};

async function FacultyCollaborationContent({ searchParams }: CollaborationPageProps) {
  const { user, profile } = await requireRole("faculty");
  const params = await searchParams;
  const activeTab = params.tab || "all";

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let oppList: any[] = [];
  let interestMap = new Map<string, string>();
  let myInterestsCount = 0;
  let myCreatedCount = 0;

  try {
    const [oppsRes, interestsRes, myCreatedRes] = await Promise.all([
      apiFetch<{ status: string; data: any[] }>("/faculty-collaboration", {
        headers: token ? { Cookie: `auth_token=${token}` } : undefined,
      }),
      apiFetch<{ status: string; data: any[] }>("/faculty-collaboration/interests/my-interests", {
        headers: token ? { Cookie: `auth_token=${token}` } : undefined,
      }),
      apiFetch<{ status: string; data: any[] }>("/faculty-collaboration/manage/my-opportunities", {
        headers: token ? { Cookie: `auth_token=${token}` } : undefined,
      }),
    ]);

    const rawOpps = (oppsRes.data || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      opportunity_type: o.opportunityType || o.opportunity_type,
      provider_name: o.providerName || o.provider_name,
      location: o.location,
      mode: o.mode,
      start_date: o.startDate || o.start_date,
      end_date: o.endDate || o.end_date,
      application_deadline: o.applicationDeadline || o.application_deadline,
      status: o.status,
      created_at: o.createdAt || o.created_at,
      created_by: o.createdBy || o.created_by,
    }));

    if (activeTab === "fdp") {
      oppList = rawOpps.filter((o) => o.opportunity_type === "fdp" || o.opportunity_type === "workshop");
    } else if (activeTab === "research") {
      oppList = rawOpps.filter((o) => o.opportunity_type === "research_project");
    } else if (activeTab === "industry") {
      oppList = rawOpps.filter((o) => o.opportunity_type === "industry_collaboration");
    } else {
      oppList = rawOpps;
    }

    (interestsRes.data || []).forEach((item: any) => {
      const oppId = item.opportunity?.id || item.opportunity_id;
      if (oppId) {
        interestMap.set(oppId, item.status);
      }
    });

    myInterestsCount = interestsRes.data?.length || 0;
    myCreatedCount = myCreatedRes.data?.length || 0;
  } catch (err) {
    console.error("Error fetching faculty collaboration data:", err);
  }

  return (
    <DashboardShell
      userRole="faculty"
      userName={profile?.full_name || "Faculty Member"}
      userEmail={user.email || "faculty@institution.edu.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Faculty Dashboard", href: "/faculty/dashboard" },
        { label: "FDP & Research" },
      ]}
    >
      <PageHeader
        eyebrow="Faculty Growth & Research"
        eyebrowColor="saffron"
        title="FDP, Research & Industry Collaboration"
        description="A unified platform for Ayurvedic faculty to discover accredited Faculty Development Programs, joint research initiatives, and institutional collaborations."
        actions={
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/faculty/collaboration/interests" className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-ayush-saffron" />
                <span>My Interests ({myInterestsCount})</span>
              </Link>
            </Button>
            <Button asChild variant="saffron" size="sm">
              <Link href="/faculty/collaboration/manage" className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Manage Opportunities {myCreatedCount ? `(${myCreatedCount})` : ""}</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-ayush-parchment/30 pb-3 mb-8 overflow-x-auto">
        <Link
          href="/faculty/collaboration?tab=all"
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "all"
              ? "bg-ayush-saffron text-white shadow-sm"
              : "text-ayush-text-muted hover:text-ayush-text hover:bg-ayush-parchment/20"
          }`}
        >
          All Programs
        </Link>
        <Link
          href="/faculty/collaboration?tab=fdp"
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "fdp"
              ? "bg-ayush-saffron text-white shadow-sm"
              : "text-ayush-text-muted hover:text-ayush-text hover:bg-ayush-parchment/20"
          }`}
        >
          FDP & Training
        </Link>
        <Link
          href="/faculty/collaboration?tab=research"
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "research"
              ? "bg-ayush-saffron text-white shadow-sm"
              : "text-ayush-text-muted hover:text-ayush-text hover:bg-ayush-parchment/20"
          }`}
        >
          Research Projects
        </Link>
        <Link
          href="/faculty/collaboration?tab=industry"
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "industry"
              ? "bg-ayush-saffron text-white shadow-sm"
              : "text-ayush-text-muted hover:text-ayush-text hover:bg-ayush-parchment/20"
          }`}
        >
          Industry Collaboration
        </Link>
      </div>

      {/* Opportunities Grid */}
      {oppList.length === 0 ? (
        <Card className="border-dashed border-ayush-parchment/40 bg-ayush-parchment/5">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-ayush-saffron/10 text-ayush-saffron mx-auto flex items-center justify-center">
              <Microscope className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-ayush-text">No Opportunities Available</h3>
              <p className="text-sm text-ayush-text-muted max-w-md mx-auto">
                There are currently no published opportunities in this category. Check back soon or create one from your faculty or institutional profile.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/faculty/collaboration/manage">Create an Opportunity</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {oppList.map((opp) => {
            const config = TYPE_CONFIG[opp.opportunity_type] || {
              label: opp.opportunity_type,
              badgeVariant: "secondary" as const,
            };
            const myStatus = interestMap.get(opp.id);
            const isOwner = opp.created_by === user.id;

            return (
              <Card
                key={opp.id}
                className="flex flex-col border-ayush-parchment/30 bg-card hover:border-ayush-saffron/40 transition-all hover:shadow-md"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={config.badgeVariant} className="text-[10px] font-semibold tracking-wide">
                      {config.label}
                    </Badge>
                    {opp.mode && (
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                        {opp.mode}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-serif font-bold text-ayush-text leading-snug line-clamp-2">
                    {opp.title}
                  </CardTitle>
                  {opp.provider_name && (
                    <p className="text-xs text-ayush-teal font-medium flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opp.provider_name}</span>
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-ayush-text-muted line-clamp-3 leading-relaxed">
                    {opp.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-ayush-parchment/20 text-[11px] text-ayush-text-muted">
                    {opp.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-ayush-saffron shrink-0" />
                        <span className="truncate">{opp.location}</span>
                      </div>
                    )}
                    {opp.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-ayush-teal shrink-0" />
                        <span>
                          {new Date(opp.start_date).toLocaleDateString()}
                          {opp.end_date ? ` — ${new Date(opp.end_date).toLocaleDateString()}` : ""}
                        </span>
                      </div>
                    )}
                    {opp.application_deadline && (
                      <div className="text-[11px] font-medium text-ayush-text">
                        Deadline: {new Date(opp.application_deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-ayush-parchment/20 flex items-center justify-between">
                    <div>
                      {myStatus ? (
                        <Badge
                          variant={
                            myStatus === "accepted"
                              ? "herbal"
                              : myStatus === "rejected"
                              ? "destructive"
                              : myStatus === "withdrawn"
                              ? "outline"
                              : "saffron"
                          }
                          className="text-[10px] capitalize"
                        >
                          {myStatus.replace("_", " ")}
                        </Badge>
                      ) : isOwner ? (
                        <Badge variant="outline" className="text-[10px] border-ayush-gold/50 text-ayush-gold">
                          Your Opportunity
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium">Open for Interest</span>
                      )}
                    </div>

                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link href={`/faculty/collaboration/${opp.id}`} className="flex items-center gap-1">
                        <span>View Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
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

export default function FacultyCollaborationPage(props: CollaborationPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Opportunities...</div>}>
      <FacultyCollaborationContent {...props} />
    </Suspense>
  );
}
