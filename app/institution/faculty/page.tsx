import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FacultyDirectory, FacultyItem } from "./faculty-directory";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Faculty Directory — VEDA SETU",
  description: "Academic faculty roster, mentor assignments, and departmental oversight",
};

interface ExpressFaculty {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  designation: string | null;
  createdAt: string;
}

async function InstitutionFacultyContent() {
  const { user, profile } = await requireRole("institution");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let facultyList: FacultyItem[] = [];
  let institutionName: string = "Affiliated Institution";
  let institutionCode: string | null = null;
  let fetchError: string | null = null;

  try {
    const [facRes, dashRes] = await Promise.all([
      apiFetch<{ status: string; data: { faculty: ExpressFaculty[] } }>(
        "/institution/faculty",
        { headers: token ? { Cookie: `auth_token=${token}` } : undefined }
      ),
      apiFetch<{ status: string; data: { institution: { name: string; code: string | null } } }>(
        "/institution/dashboard",
        { headers: token ? { Cookie: `auth_token=${token}` } : undefined }
      ).catch(() => null),
    ]);

    facultyList = (facRes.data.faculty || []).map((f) => ({
      id: f.id,
      full_name: f.fullName || "Faculty Member",
      designation: f.designation || null,
      department: f.department || null,
      email: f.email || "",
      created_at: f.createdAt || new Date().toISOString(),
    }));

    if (dashRes?.data?.institution) {
      institutionName = dashRes.data.institution.name || institutionName;
      institutionCode = dashRes.data.institution.code;
    }
  } catch (err: any) {
    if (err.message?.includes("403") || err.message?.includes("affiliated")) {
      return (
        <DashboardShell
          userRole="institution"
          userName={profile?.full_name || "Institution Administrator"}
          userEmail={user.email || "admin@institution.edu.in"}
          breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard", href: "/institution/dashboard" }, { label: "Faculty" }]}
        >
          <PageHeader eyebrow="Campus Governance" eyebrowColor="brown" title="Faculty Management" description="Collegiate faculty roster and mentor onboarding." />
          <div className="p-6 rounded-xl bg-ayush-parchment/10 border border-ayush-parchment/30">
            <div className="flex items-start gap-4">
              <span className="p-3 rounded-lg bg-ayush-parchment/20 text-ayush-saffron shrink-0"><AlertCircle className="w-6 h-6" /></span>
              <div className="space-y-2">
                <h3 className="text-base font-medium text-ayush-text">Institutional Linkage Required</h3>
                <p className="text-sm text-ayush-text-muted leading-relaxed">Your administrative profile is not currently linked to an academic institution record. Institutional affiliation is required to manage campus faculty accounts.</p>
                <div className="pt-2"><Button asChild size="sm" variant="saffron"><Link href="/profile">Update Profile & Affiliation</Link></Button></div>
              </div>
            </div>
          </div>
        </DashboardShell>
      );
    }
    fetchError = err.message;
  }

  if (fetchError) {
    return (
      <DashboardShell
        userRole="institution"
        userName={profile?.full_name || "Institution Administrator"}
        userEmail={user.email || "admin@institution.edu.in"}
        breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard", href: "/institution/dashboard" }, { label: "Faculty" }]}
      >
        <div className="p-6 rounded-xl border border-ayush-terracotta/20 bg-ayush-terracotta/10 text-ayush-terracotta text-xs">
          Failed to load campus faculty: {fetchError}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      userRole="institution"
      userName={profile?.full_name || "Institution Administrator"}
      userEmail={user.email || "admin@institution.edu.in"}
      breadcrumbs={[{ label: "Ayush Portal", href: "/" }, { label: "Institution Dashboard", href: "/institution/dashboard" }, { label: "Faculty" }]}
    >
      <div className="space-y-6">
        <PageHeader
          eyebrow="Campus Governance"
          eyebrowColor="brown"
          title="Faculty Management"
          description={`Oversee collegiate educators, clinical mentors, and academic faculty for ${institutionName}.`}
        />
        <FacultyDirectory
          initialFaculty={facultyList}
          institutionName={institutionName}
          institutionCode={institutionCode}
        />
      </div>
    </DashboardShell>
  );
}

export default function InstitutionFacultyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">Loading Campus Faculty...</div>
        </div>
      }
    >
      <InstitutionFacultyContent />
    </Suspense>
  );
}
