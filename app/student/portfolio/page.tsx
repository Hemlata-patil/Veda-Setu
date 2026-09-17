import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PortfolioView } from "./portfolio-view";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export const metadata = {
  title: "My Portfolio — VEDA SETU",
  description: "Your academic, competency and professional evidence in one place.",
};

async function StudentPortfolioContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let portfolioData: any = {
    profile: null,
    competencies: [],
    items: [],
    documents: [],
    placements: [],
  };

  if (token) {
    try {
      const res = await apiFetch<{
        status: string;
        data: {
          profile: any;
          competencies: Array<{
            id: string;
            name: string;
            category: any;
            score: number;
            verified: boolean;
          }>;
          items: any[];
          documents: any[];
          placements: any[];
        };
      }>("/portfolio/student", {
        headers: {
          Cookie: `auth_token=${token}`,
        },
      });

      portfolioData = res.data;
    } catch (err) {
      console.error("Error fetching student portfolio data:", err);
    }
  }

  const profileData = {
    id: user.id,
    full_name: portfolioData.profile?.full_name || profile?.full_name || "Ayush Scholar",
    email: user.email || portfolioData.profile?.email || "",
    role: portfolioData.profile?.role || profile?.role || "student",
    phone: profile?.phone || null,
    program: portfolioData.profile?.program || profile?.program || null,
    year: portfolioData.profile?.year || profile?.year || null,
    department: portfolioData.profile?.department || profile?.department || null,
    institution_name: portfolioData.profile?.institution_name || null,
  };

  const formattedPlacements = (portfolioData.placements || []).map((plc: any) => ({
    id: plc.id,
    opportunityTitle: plc.opportunity_title || "Industry Placement",
    organizationName: plc.organization_name || null,
    engagementType: plc.engagement_type || "internship",
    status: plc.status,
    startDate: plc.start_date,
    completionDate: plc.actual_end_date || plc.expected_end_date,
    outcome: plc.outcome,
  }));

  return (
    <DashboardShell
      userRole="student"
      userName={profileData.full_name}
      userEmail={user.email || "student@ayush.local"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "My Portfolio" },
      ]}
    >
      <PageHeader
        eyebrow="Digital Portfolio"
        eyebrowColor="green"
        title="My Portfolio"
        description="Your academic, competency and professional evidence in one place."
      />

      <PortfolioView
        profile={profileData}
        competencies={portfolioData.competencies || []}
        portfolioItems={portfolioData.items || []}
        documents={portfolioData.documents || []}
        placements={formattedPlacements}
        collaborations={[]}
      />
    </DashboardShell>
  );
}

export default function StudentPortfolioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Student Portfolio...
          </div>
        </div>
      }
    >
      <StudentPortfolioContent />
    </Suspense>
  );
}
