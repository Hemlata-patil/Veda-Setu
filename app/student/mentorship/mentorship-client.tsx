"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  GraduationCap,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  Send,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { requestMentorship } from "./actions";

export interface FacultyItem {
  id: string;
  fullName: string;
  department: string | null;
  designation: string;
}

export interface MentorshipItem {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyDepartment: string | null;
  status: "pending" | "active" | "completed" | "rejected";
  requestNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentMentorshipClientProps {
  hasInstitution: boolean;
  institutionName: string | null;
  activeMentorship: MentorshipItem | null;
  pendingMentorship: MentorshipItem | null;
  latestRejectedMentorship: MentorshipItem | null;
  completedMentorships: MentorshipItem[];
  availableFaculty: FacultyItem[];
}

export function StudentMentorshipClient({
  hasInstitution,
  institutionName,
  activeMentorship,
  pendingMentorship,
  latestRejectedMentorship,
  completedMentorships,
  availableFaculty,
}: StudentMentorshipClientProps) {
  const [selectedFaculty, setSelectedFaculty] = React.useState<FacultyItem | null>(null);
  const [requestNote, setRequestNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const facultyListRef = React.useRef<HTMLDivElement>(null);

  const handleOpenRequestModal = (faculty: FacultyItem) => {
    setSelectedFaculty(faculty);
    setRequestNote("");
    setFeedback(null);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedFaculty(null);
    setRequestNote("");
    setFeedback(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await requestMentorship({
        facultyId: selectedFaculty.id,
        requestNote: requestNote.trim() || undefined,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Mentorship request sent successfully to ${selectedFaculty.fullName}!`,
        });
        setTimeout(() => {
          setSelectedFaculty(null);
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to submit mentorship request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToFaculty = () => {
    facultyListRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Missing institutional affiliation error state
  if (!hasInstitution) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-ayush-dark">
          <div className="flex items-start gap-4">
            <span className="p-3 rounded-xl bg-amber-500/20 text-amber-800 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </span>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-ayush-dark">
                Institutional Affiliation Required
              </h3>
              <p className="text-sm text-ayush-muted leading-relaxed">
                Your student profile is not currently affiliated with an academic institution. Institutional
                affiliation is mandatory to discover qualified faculty mentors and submit mentorship requests.
              </p>
              <div className="pt-2">
                <Button asChild size="sm" variant="default" className="bg-ayush-green hover:bg-ayush-green/90 text-white">
                  <Link href="/profile">Update Profile & Affiliation</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasCurrentActiveOrPending = Boolean(activeMentorship || pendingMentorship);

  return (
    <div className="space-y-8">
      {/* Institution Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-ayush-sand/30 border border-ayush-border/50 text-xs text-ayush-muted">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-ayush-green" />
          <span>Affiliated Institution:</span>
          <span className="font-semibold text-ayush-dark">{institutionName || "Ayush Recognized Institution"}</span>
        </div>
        <span className="text-[11px] text-ayush-muted">
          Mentorship is restricted strictly within your enrolled academic cohort.
        </span>
      </div>

      {/* 2. Active Mentorship Card */}
      {activeMentorship && (
        <Card accent="green" className="overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-green/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ayush-green/10 border border-ayush-green/20 flex items-center justify-center text-ayush-green font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-ayush-green">
                      1-on-1 Academic Guidance
                    </span>
                    <Badge variant="herbal" dot>
                      Active Mentorship
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-heading font-bold text-ayush-dark">
                    {activeMentorship.facultyName}
                  </CardTitle>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-ayush-muted block">
                  Started on {new Date(activeMentorship.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Faculty Department</span>
                <span className="text-sm font-medium text-ayush-dark">
                  {activeMentorship.facultyDepartment || "Ayurveda Academic Faculty"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Mentorship Status</span>
                <span className="text-sm font-semibold text-ayush-green flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active Supervision
                </span>
              </div>
            </div>

            {activeMentorship.requestNote && (
              <div className="p-4 rounded-xl border border-ayush-border/40 bg-ayush-card text-xs text-ayush-muted space-y-1">
                <span className="font-semibold text-ayush-dark block">Your Initial Request Note:</span>
                <p className="italic text-ayush-dark/80">"{activeMentorship.requestNote}"</p>
              </div>
            )}

            <p className="text-xs text-ayush-muted leading-relaxed">
              Your mentor provides academic supervision, monitors your clinical competency milestone achievements,
              and supports your professional development.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 3. Pending Mentorship Request Card */}
      {pendingMentorship && (
        <Card accent="saffron" className="overflow-hidden shadow-sm">
          <CardHeader className="border-b border-ayush-border/40 pb-4 bg-ayush-saffron/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ayush-saffron/10 border border-ayush-saffron/20 flex items-center justify-center text-ayush-saffron font-bold">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-ayush-saffron">
                      Mentorship Request
                    </span>
                    <Badge variant="saffron" dot>
                      Request Pending
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-heading font-bold text-ayush-dark">
                    {pendingMentorship.facultyName}
                  </CardTitle>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-ayush-muted block">
                  Requested on {new Date(pendingMentorship.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Designation & Department</span>
                <span className="text-sm font-medium text-ayush-dark">
                  Faculty Mentor — {pendingMentorship.facultyDepartment || "Ayush Faculty"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-ayush-border/50 bg-ayush-sand/20 space-y-1">
                <span className="text-xs text-ayush-muted block">Application State</span>
                <span className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Awaiting Faculty Review
                </span>
              </div>
            </div>

            {pendingMentorship.requestNote ? (
              <div className="p-4 rounded-xl border border-ayush-border/40 bg-ayush-card text-xs text-ayush-muted space-y-1">
                <span className="font-semibold text-ayush-dark block">Your Submitted Note:</span>
                <p className="italic text-ayush-dark/80">"{pendingMentorship.requestNote}"</p>
              </div>
            ) : (
              <p className="text-xs text-ayush-muted italic">No initial message provided with this request.</p>
            )}

            <div className="p-3.5 rounded-xl bg-ayush-saffron/10 border border-ayush-saffron/20 text-xs text-ayush-dark leading-relaxed">
              Your mentorship invitation has been delivered to <strong>{pendingMentorship.facultyName}</strong>. Once the faculty
              reviews and accepts your request, your 1-on-1 mentorship lifecycle will become active.
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Rejected Request Notice (If no active/pending mentorship) */}
      {!hasCurrentActiveOrPending && latestRejectedMentorship && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-ayush-dark">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-xl bg-red-500/10 text-red-600 shrink-0">
                <XCircle className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ayush-dark">
                  Mentorship Request Not Accepted
                </h4>
                <p className="text-xs text-ayush-muted leading-relaxed">
                  Your previous request to <strong>{latestRejectedMentorship.facultyName}</strong> was not accepted.
                  You may choose another faculty mentor from your institution cohort below.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={scrollToFaculty}
              className="gap-1.5 self-start sm:self-auto shrink-0 text-xs"
            >
              <span>Find Another Mentor</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. Completed Mentorships History */}
      {completedMentorships.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading text-base font-bold text-ayush-dark flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ayush-green" />
            <span>Completed Mentorships ({completedMentorships.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completedMentorships.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-ayush-border/50 bg-ayush-card text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-ayush-dark">{m.facultyName}</span>
                  <Badge variant="parchment">Completed</Badge>
                </div>
                <p className="text-ayush-muted">{m.facultyDepartment || "Ayurveda Department"}</p>
                <span className="text-[11px] text-ayush-muted block">
                  Concluded on {new Date(m.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Find a Faculty Mentor Section */}
      <div ref={facultyListRef} className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ayush-border/40 pb-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-ayush-dark">
              {hasCurrentActiveOrPending ? "Institution Faculty Directory" : "Find a Faculty Mentor"}
            </h2>
            <p className="text-xs text-ayush-muted mt-0.5">
              Verified academic faculty and clinical preceptors at {institutionName || "your institution"}.
            </p>
          </div>
          {hasCurrentActiveOrPending && (
            <span className="text-xs text-ayush-muted italic">
              (You have an active or pending mentorship relationship)
            </span>
          )}
        </div>

        {availableFaculty.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No Faculty Mentors Available"
            description="No faculty members are currently registered from your institution cohort. Check back later or contact your institution coordinator."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableFaculty.map((faculty) => {
              const isCurrentMentor = activeMentorship?.facultyId === faculty.id;
              const isPendingMentor = pendingMentorship?.facultyId === faculty.id;

              return (
                <Card
                  key={faculty.id}
                  className={`overflow-hidden transition-all duration-200 border-ayush-border/60 ${
                    isCurrentMentor
                      ? "ring-2 ring-ayush-green bg-ayush-green/5"
                      : isPendingMentor
                      ? "ring-2 ring-ayush-saffron bg-ayush-saffron/5"
                      : "hover:border-ayush-green/50 hover:shadow-warm"
                  }`}
                >
                  <CardHeader className="pb-3 border-b border-ayush-border/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-ayush-sand border border-ayush-border flex items-center justify-center text-ayush-dark font-bold shrink-0">
                        <User className="w-5 h-5 text-ayush-green" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-bold text-base text-ayush-dark truncate">
                          {faculty.fullName}
                        </h3>
                        <p className="text-xs text-ayush-muted truncate">
                          {faculty.designation}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-ayush-muted block">
                        Department
                      </span>
                      <p className="text-xs font-medium text-ayush-dark">
                        {faculty.department || "Academic & Clinical Medicine"}
                      </p>
                    </div>

                    <div className="pt-2">
                      {isCurrentMentor ? (
                        <Button size="sm" variant="outline" disabled className="w-full text-xs text-ayush-green border-ayush-green/40">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Current Mentor
                        </Button>
                      ) : isPendingMentor ? (
                        <Button size="sm" variant="outline" disabled className="w-full text-xs text-ayush-saffron border-ayush-saffron/40">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Request Pending
                        </Button>
                      ) : hasCurrentActiveOrPending ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="w-full text-xs text-ayush-muted"
                          title="You already have an active or pending mentorship."
                        >
                          Unavailable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full bg-ayush-green hover:bg-ayush-green/90 text-white gap-1.5 text-xs"
                          onClick={() => handleOpenRequestModal(faculty)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Request Mentorship</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Request Mentorship Modal */}
      {selectedFaculty && (
        <Modal
          isOpen={Boolean(selectedFaculty)}
          onClose={handleCloseModal}
          title="Request Faculty Mentorship"
          description={`Initiate a formal academic mentorship request with ${selectedFaculty.fullName}.`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitRequest} className="space-y-5 pt-2">
            {/* Target Faculty Summary */}
            <div className="p-4 rounded-xl border border-ayush-border/50 bg-ayush-sand/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ayush-green/10 border border-ayush-green/20 flex items-center justify-center text-ayush-green font-bold shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-ayush-dark">
                  {selectedFaculty.fullName}
                </h4>
                <p className="text-xs text-ayush-muted">
                  {selectedFaculty.designation} &bull; {selectedFaculty.department || "Ayurveda Department"}
                </p>
              </div>
            </div>

            {/* Message input */}
            <div className="space-y-2">
              <label htmlFor="requestNote" className="block text-xs font-semibold text-ayush-dark">
                Message to Faculty (Optional)
              </label>
              <Textarea
                id="requestNote"
                rows={4}
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Tell the faculty member why you would like their mentorship, clinical interests, or specific focus areas..."
                className="text-xs"
                disabled={isSubmitting}
              />
              <span className="text-[11px] text-ayush-muted block">
                This note will be visible only to the faculty member to evaluate your mentorship request.
              </span>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-ayush-green hover:bg-ayush-green/90 text-white gap-1.5 text-xs"
              >
                {isSubmitting ? (
                  <span>Sending Request...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
