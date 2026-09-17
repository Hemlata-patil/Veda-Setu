"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { withdrawApplication } from "./actions";
import { LogOut } from "lucide-react";

interface WithdrawButtonProps {
  applicationId: string;
}

export function WithdrawButton({ applicationId }: WithdrawButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await withdrawApplication(applicationId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to withdraw application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={handleWithdraw}
      className="text-xs h-8 text-amber-800 hover:text-amber-900 border-amber-300 hover:bg-amber-50"
    >
      <LogOut className="w-3.5 h-3.5 mr-1" />
      <span>{loading ? "Withdrawing..." : "Withdraw"}</span>
    </Button>
  );
}
