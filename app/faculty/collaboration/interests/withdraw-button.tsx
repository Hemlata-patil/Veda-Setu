"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { withdrawInterest } from "../actions";
import { Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function WithdrawInterestButton({ interestId }: { interestId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleWithdraw() {
    if (!confirm("Are you sure you want to withdraw your expression of interest?")) {
      return;
    }

    setIsPending(true);
    const res = await withdrawInterest(interestId);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to withdraw interest.");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleWithdraw}
      disabled={isPending}
      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
    >
      {isPending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          <span>Withdrawing...</span>
        </>
      ) : (
        <>
          <XCircle className="w-3.5 h-3.5 mr-1" />
          <span>Withdraw</span>
        </>
      )}
    </Button>
  );
}
