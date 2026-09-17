"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateInterestStatus } from "../../actions";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReviewInterestActions({
  interestId,
  currentStatus,
}: {
  interestId: string;
  currentStatus: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleStatus(newStatus: "under_review" | "accepted" | "rejected") {
    setIsPending(true);
    const res = await updateInterestStatus(interestId, newStatus);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to update status.");
    }
  }

  // Owner state machine:
  // interested -> under_review
  // under_review -> accepted / rejected

  if (currentStatus === "interested") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleStatus("under_review")}
        disabled={isPending}
        className="text-xs text-ayush-saffron border-ayush-saffron/30 hover:bg-ayush-saffron/10"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
        ) : (
          <ArrowRight className="w-3.5 h-3.5 mr-1" />
        )}
        <span>Mark Under Review</span>
      </Button>
    );
  }

  if (currentStatus === "under_review") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatus("accepted")}
          disabled={isPending}
          className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
          )}
          <span>Accept</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatus("rejected")}
          disabled={isPending}
          className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : (
            <XCircle className="w-3.5 h-3.5 mr-1" />
          )}
          <span>Reject</span>
        </Button>
      </div>
    );
  }

  return (
    <span className="text-xs text-ayush-text-muted font-medium italic">
      Decision Finalized
    </span>
  );
}
