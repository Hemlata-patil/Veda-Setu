"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOpportunityStatus } from "../actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ManageStatusButtons({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string;
  currentStatus: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleStatusChange(newStatus: "draft" | "published" | "closed" | "archived") {
    setIsPending(true);
    const res = await updateOpportunityStatus(opportunityId, newStatus);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to update status.");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {currentStatus === "draft" && (
        <Button
          size="sm"
          variant="saffron"
          className="text-xs"
          disabled={isPending}
          onClick={() => handleStatusChange("published")}
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Publish
        </Button>
      )}

      {currentStatus === "published" && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
          disabled={isPending}
          onClick={() => handleStatusChange("closed")}
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Close
        </Button>
      )}

      {currentStatus === "closed" && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-ayush-teal border-ayush-teal/30 hover:bg-ayush-teal/10"
          disabled={isPending}
          onClick={() => handleStatusChange("published")}
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Reopen
        </Button>
      )}
    </div>
  );
}
