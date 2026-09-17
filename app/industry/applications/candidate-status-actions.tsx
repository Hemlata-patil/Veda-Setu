"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateCandidateStatus } from "./actions";
import { ApplicationStatus } from "@/lib/applications";
import { CheckCircle2, UserCheck, XCircle, Search, Eye } from "lucide-react";
import Link from "next/link";

interface CandidateStatusActionsProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
  showDetailLink?: boolean;
}

export function CandidateStatusActions({
  applicationId,
  currentStatus,
  showDetailLink = false,
}: CandidateStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    try {
      setLoading(true);
      await updateCandidateStatus({ applicationId, newStatus });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* If applied -> Under Review */}
      {currentStatus === "applied" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => handleStatusChange("under_review")}
          className="text-xs h-8 text-amber-800 border-amber-300 hover:bg-amber-50"
        >
          <Search className="w-3.5 h-3.5 mr-1" />
          <span>Mark Under Review</span>
        </Button>
      )}

      {/* If under_review -> Shortlist or Reject */}
      {currentStatus === "under_review" && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => handleStatusChange("shortlisted")}
            className="text-xs h-8 text-ayush-herbal border-ayush-herbal/40 hover:bg-ayush-herbal/10"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Shortlist</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => handleStatusChange("rejected")}
            className="text-xs h-8 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span>Reject</span>
          </Button>
        </>
      )}

      {/* If shortlisted -> Select or Reject */}
      {currentStatus === "shortlisted" && (
        <>
          <Button
            size="sm"
            variant="default"
            disabled={loading}
            onClick={() => handleStatusChange("selected")}
            className="text-xs h-8 bg-ayush-herbal hover:bg-ayush-herbal/90 text-white"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            <span>Select Candidate</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => handleStatusChange("rejected")}
            className="text-xs h-8 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span>Reject</span>
          </Button>
        </>
      )}

      {showDetailLink && (
        <Button asChild size="sm" variant="outline" className="text-xs h-8">
          <Link href={`/industry/applications/${applicationId}`}>
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>View Candidate</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
