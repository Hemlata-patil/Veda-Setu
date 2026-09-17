import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

async function RoleDispatcher() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  try {
    const res = await apiFetch<{ status: string; user: { role: string } }>("/auth/me", {
      headers: {
        Cookie: `auth_token=${token}`,
      },
    });

    if (res?.user?.role) {
      switch (res.user.role) {
        case "super_admin":
          redirect("/super-admin/dashboard");
        case "faculty":
          redirect("/faculty/dashboard");
        case "institution":
          redirect("/institution/dashboard");
        case "industry":
          redirect("/industry/dashboard");
        case "student":
          redirect("/student/dashboard");
        default:
          redirect("/profile");
      }
    }
    redirect("/auth/login");
  } catch {
    redirect("/auth/login");
  }
  return null;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ayush-primary" />
        </div>
      }
    >
      <RoleDispatcher />
    </Suspense>
  );
}
