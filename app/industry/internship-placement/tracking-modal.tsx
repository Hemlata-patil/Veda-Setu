"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlacementTracking, updatePlacementTracking } from "./actions";
import { PlayCircle, Edit3, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ModalProps {
  applicationId: string;
  studentName: string;
  opportunityTitle: string;
  suggestedType: "internship" | "placement";
  placement: any | null;
}

export function PlacementTrackingModal({
  applicationId,
  studentName,
  opportunityTitle,
  suggestedType,
  placement,
}: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const isExisting = !!placement;

  // Form states
  const [engagementType, setEngagementType] = useState<"internship" | "placement">(
    placement?.engagement_type || suggestedType
  );
  const [status, setStatus] = useState<string>(placement?.status || "selected");
  const [startDate, setStartDate] = useState<string>(placement?.start_date || "");
  const [expectedEndDate, setExpectedEndDate] = useState<string>(placement?.expected_end_date || "");
  const [actualEndDate, setActualEndDate] = useState<string>(placement?.actual_end_date || "");
  const [progressPercent, setProgressPercent] = useState<number>(
    placement?.progress_percent !== undefined ? Number(placement.progress_percent) : 0
  );
  const [supervisorName, setSupervisorName] = useState<string>(placement?.supervisor_name || "");
  const [supervisorEmail, setSupervisorEmail] = useState<string>(placement?.supervisor_email || "");
  const [outcome, setOutcome] = useState<string>(placement?.outcome || "");

  // Status transitions
  // selected -> offer_accepted | withdrawn
  // offer_accepted -> joined | withdrawn
  // joined -> in_progress
  // in_progress -> completed
  const currentStatus = placement?.status || "selected";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    let res;
    if (!isExisting) {
      res = await createPlacementTracking({
        applicationId,
        engagementType,
        startDate: startDate || undefined,
        expectedEndDate: expectedEndDate || undefined,
        supervisorName: supervisorName || undefined,
        supervisorEmail: supervisorEmail || undefined,
      });
    } else {
      res = await updatePlacementTracking(placement.id, {
        status: status as any,
        startDate: startDate || undefined,
        expectedEndDate: expectedEndDate || undefined,
        actualEndDate: actualEndDate || undefined,
        progressPercent,
        supervisorName: supervisorName || undefined,
        supervisorEmail: supervisorEmail || undefined,
        outcome: outcome || undefined,
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.error || "Failed to save tracking record.");
    }
  }

  const isTerminal = placement?.status === "completed" || placement?.status === "withdrawn";

  return (
    <>
      <Button
        size="sm"
        variant={isExisting ? "outline" : "default"}
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1.5"
      >
        {isExisting ? (
          <>
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update Tracking</span>
          </>
        ) : (
          <>
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Start Tracking</span>
          </>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-ayush-parchment/40 rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8 text-xs">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-ayush-text-muted hover:text-ayush-text"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-serif font-bold text-ayush-text mb-1">
              {isExisting ? "Update Engagement Tracking" : "Initialize Placement Tracking"}
            </h3>
            <p className="text-ayush-text-muted mb-4">
              Candidate: <strong className="text-ayush-text">{studentName}</strong> • Program:{" "}
              <span className="text-ayush-teal font-medium">{opportunityTitle}</span>
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isExisting ? (
                <div className="space-y-1">
                  <label className="font-semibold text-ayush-text">Engagement Type *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1"
                    value={engagementType}
                    onChange={(e: any) => setEngagementType(e.target.value)}
                  >
                    <option value="internship">Internship / Apprenticeship</option>
                    <option value="placement">Full-time Career Placement</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-semibold text-ayush-text">Workflow Status</label>
                  {isTerminal ? (
                    <div className="p-2.5 rounded bg-ayush-parchment/20 text-ayush-text font-medium capitalize">
                      {currentStatus} (Terminal State)
                    </div>
                  ) : (
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value={currentStatus}>Current: {currentStatus.replace("_", " ")}</option>
                      {currentStatus === "selected" && (
                        <>
                          <option value="offer_accepted">Offer Accepted</option>
                          <option value="withdrawn">Withdrawn</option>
                        </>
                      )}
                      {currentStatus === "offer_accepted" && (
                        <>
                          <option value="joined">Joined</option>
                          <option value="withdrawn">Withdrawn</option>
                        </>
                      )}
                      {currentStatus === "joined" && (
                        <option value="in_progress">In Progress</option>
                      )}
                      {currentStatus === "in_progress" && (
                        <option value="completed">Completed</option>
                      )}
                    </select>
                  )}
                </div>
              )}

              {/* Progress Slider (Only if existing) */}
              {isExisting && (
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-ayush-text">
                    <span>Progress: {progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="w-full cursor-pointer accent-ayush-herbal"
                    disabled={isTerminal}
                  />
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isTerminal}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Expected End Date</label>
                  <Input
                    type="date"
                    value={expectedEndDate}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    disabled={isTerminal}
                  />
                </div>
              </div>

              {isExisting && (
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Actual End Date</label>
                  <Input
                    type="date"
                    value={actualEndDate}
                    onChange={(e) => setActualEndDate(e.target.value)}
                    disabled={isTerminal}
                  />
                </div>
              )}

              {/* Supervisor Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Supervisor Name</label>
                  <Input
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="e.g. Dr. A. Sharma"
                    disabled={isTerminal}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Supervisor Email</label>
                  <Input
                    type="email"
                    value={supervisorEmail}
                    onChange={(e) => setSupervisorEmail(e.target.value)}
                    placeholder="supervisor@enterprise.in"
                    disabled={isTerminal}
                  />
                </div>
              </div>

              {/* Outcome feedback (Only if existing) */}
              {isExisting && (
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Outcome / Feedback</label>
                  <Textarea
                    rows={2}
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Notes on performance, completion certificate details, or placement offer confirmation..."
                    disabled={isTerminal}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-ayush-parchment/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {!isTerminal && (
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isExisting ? "Save Changes" : "Confirm Tracking"}</span>
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
