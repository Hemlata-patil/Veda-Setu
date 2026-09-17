import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StudentMentorshipClient, FacultyItem, MentorshipItem } from "./mentorship-client";
import { Suspense } from "react";

export const metadata = {
  title: "My Mentorship — VEDA SETU",
  description: "Connect with verified faculty mentors from your academic institution for clinical and competency guidance.",
};

async function StudentMentorshipContent() {
  const { user, profile } = await requireRole("student");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let hasInstitution = Boolean(profile?.institution_id);
  let institutionName: string | null = null;
  let activeMentorship: MentorshipItem | null = null;
  let pendingMentorship: MentorshipItem | null = null;
  let latestRejectedMentorship: MentorshipItem | null = null;
  let completedMentorships: MentorshipItem[] = [];
  let availableFaculty: FacultyItem[] = [];

  if (token) {
    try {
      const res = await apiFetch<{
        status: string;
        data: {
          activeMentorship: MentorshipItem | null;
          pendingMentorship: MentorshipItem | null;
          latestRejectedMentorship: MentorshipItem | null;
          completedMentorships: MentorshipItem[];
          availableFaculty: FacultyItem[];
          hasInstitution: boolean;
          institutionName: string | null;
        };
      }>("/mentorship/student", {
        headers: {
          Cookie: `auth_token=${token}`,
        },
      });

      const data = res.data;
      hasInstitution = data.hasInstitution;
      institutionName = data.institutionName;
      activeMentorship = data.activeMentorship;
      pendingMentorship = data.pendingMentorship;
      latestRejectedMentorship = data.latestRejectedMentorship;
      completedMentorships = data.completedMentorships || [];
      availableFaculty = data.availableFaculty || [];
    } catch (err) {
      console.error("Error fetching mentorship data:", err);
    }
  }

  return (
    <DashboardShell
      userRole="student"
      userName={profile?.full_name || "Ayush Scholar"}
      userEmail={user.email || "student@institution.edu.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Student Dashboard", href: "/student/dashboard" },
        { label: "My Mentorship" },
      ]}
    >
      <PageHeader
        eyebrow="Academic Supervision"
        eyebrowColor="green"
        title="My Mentorship"
        description="Connect with recognized institutional faculty mentors for 1-on-1 academic guidance, clinical case coaching, and competency development."
      />

      <StudentMentorshipClient
        hasInstitution={hasInstitution}
        institutionName={institutionName}
        activeMentorship={activeMentorship}
        pendingMentorship={pendingMentorship}
        latestRejectedMentorship={latestRejectedMentorship}
        completedMentorships={completedMentorships}
        availableFaculty={availableFaculty}
      />
    </DashboardShell>
  );
}

export default function StudentMentorshipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-lg text-ayush-dark">
            Loading Mentorship Portal...
          </div>
        </div>
      }
    >
      <StudentMentorshipContent />
    </Suspense>
  );
}
