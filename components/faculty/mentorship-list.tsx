"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Award,
  ArrowUpRight,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Send,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import {
  updateMentorshipNote,
  completeMentorship,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
} from "@/app/faculty/mentorship/actions";

export interface MenteeItem {
  id: string;
  studentId: string;
  studentName: string;
  status: "active" | "completed";
  mentorNote: string | null;
  overallScore: number | null;
  priorityAreasCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  program: string | null;
  year: number | null;
  department: string | null;
  status: "pending" | "rejected";
  requestNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MentorshipListProps {
  pendingRequests: MentorshipRequestItem[];
  activeMentees: MenteeItem[];
  completedMentees: MenteeItem[];
}

export function MentorshipList({
  pendingRequests,
  activeMentees,
  completedMentees,
}: MentorshipListProps) {
  // If there are pending requests, default to "requests" tab, otherwise "active"
  const [currentTab, setCurrentTab] = React.useState(
    pendingRequests.length > 0 ? "requests" : "active"
  );

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <TabsList className="bg-ayush-sand/40">
          <TabsTrigger value="requests" className="gap-2">
            <span>Mentorship Requests</span>
            <Badge
              variant={pendingRequests.length > 0 ? "saffron" : "parchment"}
              className="text-[10px] px-1.5 py-0"
            >
              {pendingRequests.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="active" className="gap-2">
            <span>Active Mentees</span>
            <Badge
              variant={activeMentees.length > 0 ? "herbal" : "parchment"}
              className="text-[10px] px-1.5 py-0"
            >
              {activeMentees.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="completed" className="gap-2">
            <span>Completed</span>
            <Badge variant="parchment" className="text-[10px] px-1.5 py-0">
              {completedMentees.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <Button asChild size="sm" variant="outline" className="gap-1.5 self-start sm:self-auto text-xs">
          <Link href="/faculty/students">
            <User className="w-4 h-4" />
            <span>Discover Students</span>
          </Link>
        </Button>
      </div>

      {/* 1. Mentorship Requests Tab (Pending) */}
      <TabsContent value="requests" className="space-y-4">
        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Pending Mentorship Requests"
            description="No pending mentorship requests. When students from your academic institution submit a mentorship request to you, they will appear here for your review."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map((req) => (
              <MentorshipRequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* 2. Active Mentees Tab (Active) */}
      <TabsContent value="active" className="space-y-4">
        {activeMentees.length === 0 ? (
          <EmptyState
            icon={User}
            title="No Active Mentees"
            description="No active mentees yet. You can accept incoming student mentorship requests or browse your campus student cohort to initiate mentorship."
            action={
              <Button asChild size="sm" variant="saffron">
                <Link href="/faculty/students">Browse Institution Students</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeMentees.map((mentee) => (
              <MenteeCard key={mentee.id} mentee={mentee} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* 3. Completed Mentorships Tab (Completed) */}
      <TabsContent value="completed" className="space-y-4">
        {completedMentees.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Completed Mentorships"
            description="No completed mentorships yet. When an academic mentorship lifecycle concludes, completed records will be archived here for your reference."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {completedMentees.map((mentee) => (
              <MenteeCard key={mentee.id} mentee={mentee} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function MentorshipRequestCard({ request }: { request: MentorshipRequestItem }) {
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionTaken, setActionTaken] = React.useState<"accepted" | "rejected" | null>(null);

  const handleAccept = async () => {
    const confirmed = window.confirm(`Accept mentorship request from ${request.studentName}?`);
    if (!confirmed) return;

    setIsAccepting(true);
    setFeedback(null);

    try {
      await acceptMentorshipRequest(request.id);
      setActionTaken("accepted");
      setFeedback({
        type: "success",
        message: `Mentorship request from ${request.studentName} has been accepted. The student is now listed under Active Mentees.`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to accept mentorship request.",
      });
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    const confirmed = window.confirm(`Reject mentorship request from ${request.studentName}?`);
    if (!confirmed) return;

    setIsRejecting(true);
    setFeedback(null);

    try {
      await rejectMentorshipRequest(request.id);
      setActionTaken("rejected");
      setFeedback({
        type: "success",
        message: `Mentorship request from ${request.studentName} has been declined.`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to reject mentorship request.",
      });
      setIsRejecting(false);
    }
  };

  const academicInfo = [
    request.program || "Ayurveda Scholar",
    request.year ? `Year ${request.year}` : null,
    request.department || null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Card accent="saffron" className="overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-ayush-border/40 bg-ayush-saffron/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ayush-sand border border-ayush-border flex items-center justify-center text-ayush-saffron font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-heading font-bold text-ayush-dark">
                  {request.studentName}
                </CardTitle>
                <Badge variant="saffron" dot>
                  Pending Request
                </Badge>
              </div>
              <p className="text-xs text-ayush-muted mt-0.5">{academicInfo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-ayush-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Requested on{" "}
              {new Date(request.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <Button asChild size="sm" variant="ghost" className="gap-1 text-xs text-ayush-muted hover:text-ayush-dark">
              <Link href={`/faculty/students/${request.studentId}`}>
                <span>View Profile</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-ayush-green/10 text-ayush-green border border-ayush-green/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20"
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

        {/* Student Request Message */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ayush-muted block mb-1">
            Student Message / Guidance Focus
          </span>
          {request.requestNote ? (
            <div className="p-3.5 rounded-xl bg-ayush-sand/30 border border-ayush-border/40 text-xs text-ayush-dark italic">
              "{request.requestNote}"
            </div>
          ) : (
            <p className="text-xs text-ayush-muted italic">No custom message included by the student.</p>
          )}
        </div>

        {/* Action Controls */}
        {!actionTaken ? (
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-ayush-border/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isAccepting || isRejecting}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {isRejecting ? (
                <span>Declining...</span>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span>Decline</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="bg-ayush-green hover:bg-ayush-green/90 text-white text-xs gap-1.5"
            >
              {isAccepting ? (
                <span>Accepting...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Accept Mentorship</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="pt-1 text-xs text-ayush-muted italic">
            Status updated to {actionTaken}. Refreshing pipeline...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MenteeCard({ mentee }: { mentee: MenteeItem }) {
  const [note, setNote] = React.useState(mentee.mentorNote || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCompleted, setIsCompleted] = React.useState(mentee.status === "completed");

  const handleSaveNote = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateMentorshipNote({
        mentorshipId: mentee.id,
        mentorNote: note,
      });
      setFeedback({ type: "success", message: "Mentor note updated." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update note." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    const confirmed = window.confirm(
      `Mark mentorship with ${mentee.studentName} as completed?`
    );
    if (!confirmed) return;

    setIsCompleting(true);
    setFeedback(null);
    try {
      await completeMentorship(mentee.id);
      setIsCompleted(true);
      setFeedback({ type: "success", message: "Mentorship marked as completed." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to complete mentorship." });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card accent={isCompleted ? "none" : "saffron"} className="overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-ayush-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ayush-surface-raised flex items-center justify-center text-ayush-muted border border-ayush-border">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{mentee.studentName}</CardTitle>
                {isCompleted ? (
                  <Badge variant="herbal">Completed</Badge>
                ) : (
                  <Badge variant="saffron" dot>Active</Badge>
                )}
              </div>
              <p className="text-xs text-ayush-muted flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3" />
                Updated: {new Date(mentee.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mentee.overallScore !== null ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ayush-surface-raised border border-ayush-border text-xs">
                <Award className="w-3.5 h-3.5 text-ayush-saffron" />
                <span className="font-semibold text-ayush-text">{mentee.overallScore}%</span>
                <span className="text-ayush-muted">Profile</span>
              </div>
            ) : (
              <Badge variant="parchment">Assessment Pending</Badge>
            )}

            {mentee.priorityAreasCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-ayush-muted">
                <Sparkles className="w-3.5 h-3.5 text-ayush-saffron" />
                <span>{mentee.priorityAreasCount} Priority {mentee.priorityAreasCount === 1 ? "Area" : "Areas"}</span>
              </div>
            )}

            <Button asChild size="sm" variant="ghost" className="gap-1 text-xs">
              <Link href={`/faculty/students/${mentee.studentId}`}>
                <span>View Profile</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {feedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-ayush-herbal-subtle/20 text-ayush-herbal border border-ayush-herbal/30"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-ayush-muted mb-1.5">
            Mentor Guidance Notes & Case Progress
          </label>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isCompleted || isSaving || isCompleting}
            placeholder={isCompleted ? "No guidance notes recorded." : "Enter clinical case discussion, feedback, or development goals..."}
            className="text-xs"
          />
        </div>

        {!isCompleted && (
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleComplete}
              disabled={isSaving || isCompleting}
              className="text-xs text-ayush-muted hover:text-ayush-text"
            >
              Mark Completed
            </Button>

            <Button
              variant="saffron"
              size="sm"
              onClick={handleSaveNote}
              disabled={isSaving || isCompleting}
              className="gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
