import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { InfoIcon } from "lucide-react";

async function ProtectedContent() {
  const { user, profile } = await requireAuth();

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-6 max-w-4xl mx-auto">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page accessible only to authenticated users.
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Authenticated User Details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-48 overflow-auto w-full bg-card">
          {JSON.stringify({ user, profile }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Loading protected data...</div>}>
      <ProtectedContent />
    </Suspense>
  );
}
