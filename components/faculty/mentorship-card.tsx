"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, MessageSquare, AlertCircle, Save, Check } from "lucide-react";
import { createMentorship, updateMentorshipNote, completeMentorship, acceptMentorshipRequest, rejectMentorshipRequest } from "@/app/faculty/mentorship/actions";

interface MentorshipCardProps {
  studentId: string;
  studentName: string;
  mentorship: {
    id: string;
    status: "pending" | "active" | "completed" | "rejected";
    mentor_note: string | null;
    request_note?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export function MentorshipCard({
  studentId,
  studentName,
  mentorship: initialMentorship,
}: MentorshipCardProps) {
  const [mentorship, setMentorship] = React.useState(initialMentorship);
  const [noteText, setNoteText] = React.useState(initialMentorship?.mentor_note || "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setMentorship(initialMentorship);
    setNoteText(initialMentorship?.mentor_note || "");
  }, [initialMentorship]);

  const handleStartMentorship = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await createMentorship({
        studentId,
        mentorNote: noteText,
      });
      if (res.success) {
        setMentorship({
          id: res.mentorshipId,
          status: "active",
          mentor_note: noteText.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setFeedback({ type: "success", message: `Mentorship started with ${studentName}.` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to start mentorship." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!mentorship) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      await updateMentorshipNote({
        mentorshipId: mentorship.id,
        mentorNote: noteText,
      });
      setMentorship((prev) => (prev ? { ...prev, mentor_note: noteText.trim() } : null));
      setFeedback({ type: "success", message: "Mentorship guidance note saved." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save note." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteMentorship = async () => {
    if (!mentorship) return;
    const confirmed = window.confirm(
      `Are you sure you want to mark the mentorship with ${studentName} as completed?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      await completeMentorship({ mentorshipId: mentorship.id });
      setMentorship((prev) => (prev ? { ...prev, status: "completed" } : null));
      setFeedback({ type: "success", message: "Mentorship marked as completed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to complete mentorship." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!mentorship) return;
    const confirmed = window.confirm(`Accept mentorship request from ${studentName}?`);
    if (!confirmed) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await acceptMentorshipRequest(mentorship.id);
      if (res?.success) {
        setMentorship((prev) => (prev ? { ...prev, status: "active" } : null));
        setFeedback({ type: "success", message: `Mentorship request from ${studentName} accepted.` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to accept request." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!mentorship) return;
    const confirmed = window.confirm(`Reject mentorship request from ${studentName}?`);
    if (!confirmed) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await rejectMentorshipRequest(mentorship.id);
      if (res?.success) {
        setMentorship((prev) => (prev ? { ...prev, status: "rejected" } : null));
        setFeedback({ type: "success", message: `Mentorship request from ${studentName} declined.` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to reject request." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card accent="saffron" className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-ayush-saffron/10 text-ayush-saffron">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <CardTitle className="text-lg">Academic Mentorship</CardTitle>
              <p className="text-xs text-ayush-muted mt-0.5">
                1-on-1 institutional guidance, clinical case coaching & skill development
              </p>
            </div>
          </div>

          <div>
            {(!mentorship || mentorship?.status === "rejected") && (
              <Badge variant="parchment">No Active Mentorship</Badge>
            )}
            {mentorship?.status === "pending" && (
              <Badge variant="saffron" dot>Pending Request</Badge>
            )}
            {mentorship?.status === "active" && (
              <Badge variant="saffron" dot>Active Mentorship</Badge>
            )}
            {mentorship?.status === "completed" && (
              <Badge variant="herbal">Mentorship Completed</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && (
          <div
            className={`p-3 rounded-md text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-ayush-herbal-subtle/20 text-ayush-herbal border border-ayush-herbal/30"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Case 1: Pending Student Request */}
        {mentorship?.status === "pending" && (
          <div className="space-y-3 bg-ayush-surface-raised/50 p-4 rounded-lg border border-ayush-saffron/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ayush-text">Pending Mentorship Request</span>
              <span className="text-[11px] text-ayush-muted">
                Requested: {new Date(mentorship.created_at).toLocaleDateString()}
              </span>
            </div>
            {mentorship.request_note && (
              <div className="p-3 rounded-md bg-ayush-surface border border-ayush-border/40 text-xs text-ayush-text-muted italic">
                &ldquo;{mentorship.request_note}&rdquo;
              </div>
            )}
            <p className="text-xs text-ayush-muted">
              {studentName} has submitted a formal mentorship request. You can accept to begin active supervision or decline the request.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ayush-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectRequest}
                disabled={isLoading}
                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
              >
                Reject Request
              </Button>
              <Button
                variant="saffron"
                size="sm"
                onClick={handleAcceptRequest}
                disabled={isLoading}
                className="text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Mentorship</span>
              </Button>
            </div>
          </div>
        )}

        {/* Case 2: No active or pending mentorship (or rejected past request) */}
        {(!mentorship || mentorship.status === "rejected") && (
          <div className="space-y-3">
            <p className="text-sm text-ayush-text-muted">
              Initiate a formal academic mentorship with {studentName} to track their clinical competency
              growth and provide structured feedback.
            </p>
            <div>
              <label htmlFor="initial-note" className="block text-xs font-medium text-ayush-muted mb-1.5">
                Initial Mentor Note / Focus Area (Optional)
              </label>
              <Textarea
                id="initial-note"
                rows={3}
                placeholder="e.g. Focus on Rogamarga clinical documentation and research biostatistics..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={isLoading}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="saffron"
                onClick={handleStartMentorship}
                disabled={isLoading}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Start Mentorship</span>
              </Button>
            </div>
          </div>
        )}

        {/* Case 2: Active mentorship */}
        {mentorship?.status === "active" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="mentor-note" className="text-xs font-medium text-ayush-muted">
                  Mentor Guidance Note & Developmental Actions
                </label>
                <span className="text-[11px] text-ayush-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last updated: {new Date(mentorship.updated_at).toLocaleDateString()}
                </span>
              </div>
              <Textarea
                id="mentor-note"
                rows={4}
                placeholder="Document clinical case discussions, recommended readings, and feedback..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={isLoading}
                className="text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-ayush-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompleteMentorship}
                disabled={isLoading}
                className="text-xs text-ayush-muted hover:text-ayush-text hover:border-ayush-border"
              >
                Mark Mentorship as Completed
              </Button>

              <Button
                variant="saffron"
                size="sm"
                onClick={handleSaveNote}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Note</span>
              </Button>
            </div>
          </div>
        )}

        {/* Case 3: Completed mentorship */}
        {mentorship?.status === "completed" && (
          <div className="space-y-3 bg-ayush-surface-raised/40 p-4 rounded-lg border border-ayush-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ayush-text">Final Mentorship Record</span>
              <span className="text-[11px] text-ayush-muted">
                Completed on {new Date(mentorship.updated_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-ayush-text-muted leading-relaxed whitespace-pre-wrap">
              {mentorship.mentor_note || "No final mentor notes recorded."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
