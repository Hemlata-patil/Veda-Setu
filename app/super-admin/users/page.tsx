import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserTable, UserProfileRow } from "./user-table";
import { Users } from "lucide-react";

async function UsersContent() {
  const { user, profile } = await requireSuperAdmin();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let userRows: UserProfileRow[] = [];

  if (token) {
    try {
      const res = await api.get<{
        status: string;
        data: { users: any[] };
      }>("/super-admin/users", {
        headers: { Cookie: `auth_token=${token}` },
      });
      userRows = (res?.data?.users || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || p.fullName || "",
        email: p.email,
        role: p.role,
        phone: p.phone,
        department: p.department,
        program: p.program,
        created_at: p.created_at || p.createdAt,
        institutionName: p.institutionName || p.institutions?.name || null,
        organizationName: p.organizationName || p.organizations?.name || null,
      }));
    } catch {
      userRows = [];
    }
  }

  return (
    <DashboardShell
      userRole="super_admin"
      userName={profile.full_name || "Super Admin"}
      userEmail={profile.email}
      breadcrumbs={[
        { label: "Super Admin", href: "/super-admin/dashboard" },
        { label: "Users" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ayush-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-ayush-terracotta" />
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-ayush-dark">
                User & Role Governance
              </h1>
            </div>
            <p className="text-xs text-ayush-muted mt-1">
              Oversee platform accounts, monitor role integrity, and safely manage academic assignments
            </p>
          </div>
        </div>

        <UserTable initialUsers={userRows} currentUserId={user.id} />
      </div>
    </DashboardShell>
  );
}

export default function SuperAdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Loading User Governance...
          </div>
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
