"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOpportunityStatus, deleteOpportunity } from "./actions";
import { CheckCircle2, Archive, Trash2, Eye } from "lucide-react";
import Link from "next/link";

interface OpportunityActionsProps {
  opportunityId: string;
  currentStatus: "draft" | "published" | "closed" | "archived";
}

export function OpportunityActions({
  opportunityId,
  currentStatus,
}: OpportunityActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleStatusChange = async (newStatus: "draft" | "published" | "closed" | "archived") => {
    try {
      setLoading(true);
      await updateOpportunityStatus(opportunityId, newStatus);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this opportunity? This will remove all associated competency requirements.")) {
      return;
    }
    try {
      setLoading(true);
      await deleteOpportunity(opportunityId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete opportunity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {currentStatus === "draft" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleStatusChange("published")}
          className="text-xs h-8 text-ayush-herbal border-ayush-herbal/30 hover:bg-ayush-herbal/10"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Publish
        </Button>
      )}

      {currentStatus === "published" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleStatusChange("closed")}
          className="text-xs h-8 text-ayush-muted hover:bg-ayush-sand/50"
        >
          <Archive className="w-3.5 h-3.5 mr-1" />
          Close
        </Button>
      )}

      {currentStatus === "closed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleStatusChange("published")}
          className="text-xs h-8 text-ayush-herbal border-ayush-herbal/30 hover:bg-ayush-herbal/10"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Reopen
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        disabled={loading}
        onClick={handleDelete}
        className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
}
