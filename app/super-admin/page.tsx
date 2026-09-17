import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

async function SuperAdminEntryDispatcher() {
  await requireSuperAdmin();
  redirect("/super-admin/dashboard");
  return null;
}

export default function SuperAdminEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ayush-parchment">
          <div className="animate-pulse font-heading text-xl text-ayush-dark">
            Redirecting to Super Admin Portal...
          </div>
        </div>
      }
    >
      <SuperAdminEntryDispatcher />
    </Suspense>
  );
}
