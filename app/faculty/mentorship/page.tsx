import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MentorshipList } from "@/components/faculty/mentorship-list";
import { Suspense } from "react";

export const metadata = {
  title: "Mentorship Pipeline — VEDA SETU",
  description: "Manage 1-on-1 student academic mentorships and guidance notes",
};

async function FacultyMentorshipContent() {
  const { user, profile } = await requireRole("faculty");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let pendingRequests: any[] = [];
  let activeMentees: any[] = [];
  let completedMentees: any[] = [];

  try {
    const res = await apiFetch<{
      status: string;
      data: {
        pendingRequests: any[];
        activeMentees: any[];
        completedMentees: any[];
      };
    }>("/mentorship/faculty", {
      headers: token ? { Cookie: `auth_token=${token}` } : undefined,
    });

    pendingRequests = res.data?.pendingRequests || [];
    activeMentees = res.data?.activeMentees || [];
    completedMentees = res.data?.completedMentees || [];
  } catch (err) {
    pendingRequests = [];
    activeMentees = [];
    completedMentees = [];
  }

  return (
    <DashboardShell
      userRole="faculty"
      userName={profile?.full_name || "Faculty Mentor"}
      userEmail={user.email || "faculty@institution.edu.in"}
      breadcrumbs={[
        { label: "Ayush Portal", href: "/" },
        { label: "Faculty Dashboard", href: "/faculty/dashboard" },
        { label: "Mentorship" },
      ]}
    >
      <PageHeader
        eyebrow="Academic Guidance"
        eyebrowColor="saffron"
        title="Mentorship Pipeline"
        description="Review incoming student mentorship requests, monitor active mentee clinical competencies, and document case feedback."
      />

      <MentorshipList
        pendingRequests={pendingRequests}
        activeMentees={activeMentees}
        completedMentees={completedMentees}
      />
    </DashboardShell>
  );
}

export default function FacultyMentorshipPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ayush-muted">Loading Mentorship Pipeline...</div>}>
      <FacultyMentorshipContent />
    </Suspense>
  );
}
