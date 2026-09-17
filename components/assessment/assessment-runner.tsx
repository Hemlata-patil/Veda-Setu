"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Check,
  Sparkles,
  BookOpen,
  GraduationCap,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAnswer, submitAssessment } from "@/app/student/assessment/actions";

export interface QuestionOption {
  value?: string | number;
  label?: string;
  key?: string;
  text?: string;
}

export interface QuestionItem {
  id: string;
  question_number: number;
  question_type: "mcq" | "self_rating";
  question_text: string;
  options: QuestionOption[] | null;
  competency_id: string;
  competency?: {
    name: string;
    code?: string;
    category: string;
  };
}

export interface AnswerState {
  answerValue?: number | null;
  answerText?: string | null;
}

interface AssessmentRunnerProps {
  attemptId: string;
  templateTitle: string;
  questions: QuestionItem[];
  initialAnswers: Record<string, AnswerState>;
}

export function AssessmentRunner({
  attemptId,
  templateTitle,
  questions,
  initialAnswers,
}: AssessmentRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(initialAnswers);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter(
    (a) => (a.answerValue !== undefined && a.answerValue !== null) || (a.answerText !== undefined && a.answerText !== null && a.answerText !== "")
  ).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Category Icon & Label Helper
  const getCategoryMeta = (cat?: string) => {
    switch (cat) {
      case "academic_domain":
        return { label: "Academic / Domain", icon: BookOpen, variant: "herbal" as const };
      case "clinical_practical":
        return { label: "Clinical / Practical", icon: GraduationCap, variant: "saffron" as const };
      case "research":
        return { label: "Research & Evidence", icon: Sparkles, variant: "parchment" as const };
      case "professional":
        return { label: "Professional Practice", icon: Award, variant: "default" as const };
      default:
        return { label: cat || "Competency", icon: BookOpen, variant: "herbal" as const };
    }
  };

  const catMeta = getCategoryMeta(currentQuestion?.competency?.category);
  const CatIcon = catMeta.icon;

  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || { answerValue: null, answerText: null }) : { answerValue: null, answerText: null };

  // Handle Answer Selection & Autosave
  async function handleSelectAnswer(value: string | number, label: string) {
    if (!currentQuestion) return;

    let newAnswer: AnswerState;
    if (currentQuestion.question_type === "mcq") {
      newAnswer = { answerValue: null, answerText: String(value) };
    } else {
      newAnswer = { answerValue: Number(value), answerText: label };
    }

    // Optimistic UI update
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));

    setSaveStatus("saving");

    try {
      const res = await saveAnswer({
        attemptId,
        questionId: currentQuestion.id,
        answerValue: newAnswer.answerValue ?? undefined,
        answerText: newAnswer.answerText ?? undefined,
      });

      if (res.success) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  // Handle Final Submission
  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitAssessment(attemptId);
      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl);
      } else {
        setSubmitError("Failed to calculate assessment scores. Please retry.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected error occurred during submission.");
      setIsSubmitting(false);
    }
  }

  if (!currentQuestion) {
    return <div>No questions available.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header / Progress Overview */}
      <div className="rounded-2xl border border-ayush-border/80 bg-ayush-card/90 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-ayush-border/40">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-ayush-green">
              {templateTitle}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="font-heading text-xl font-bold text-ayush-dark">
                Question {currentIndex + 1} of {totalQuestions}
              </h2>
              <Badge variant={catMeta.variant} className="gap-1 ml-1">
                <CatIcon className="w-3 h-3" />
                <span>{catMeta.label}</span>
              </Badge>
            </div>
          </div>

          {/* Autosave Status & Answered Counter */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              {saveStatus === "saving" && (
                <span className="text-ayush-saffron flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-ayush-green flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" /> Autosaved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-red-600 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Save failed
                </span>
              )}
            </div>

            <div className="bg-ayush-sand/50 px-3 py-1.5 rounded-lg border border-ayush-border/60 text-ayush-dark font-medium">
              <span>{answeredCount} of {totalQuestions} answered</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-3">
          <Progress
            value={answeredCount}
            max={totalQuestions}
            variant="green"
            size="sm"
          />
        </div>
      </div>

      {/* Main Question Card & Question Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Active Question Canvas */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-ayush-border/80 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="outline">
                  Competency: {currentQuestion.competency?.name || "Ayurveda Core"}
                </Badge>
                <span className="text-xs text-ayush-muted">
                  {currentQuestion.question_type === "mcq" ? "Scenario MCQ (Weight: 80%)" : "Self-Rating (Weight: 20%)"}
                </span>
              </div>
              <CardTitle className="text-lg md:text-xl font-normal leading-relaxed text-ayush-dark">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-2 space-y-4">
              {/* Options Rendering */}
              {currentQuestion.question_type === "mcq" ? (
                /* MCQ Options List */
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt) => {
                    const optKey = String(opt.value ?? opt.key ?? "");
                    const optLabel = opt.label ?? opt.text ?? optKey;
                    const isSelected = String(currentAnswer.answerText || "").trim().toUpperCase() === optKey.trim().toUpperCase();
                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => handleSelectAnswer(optKey, optLabel)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? "border-ayush-green bg-ayush-sand/50 shadow-sm ring-1 ring-ayush-green"
                            : "border-ayush-border/70 bg-ayush-card/60 hover:bg-ayush-sand/30 hover:border-ayush-border"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                            isSelected
                              ? "bg-ayush-green text-white border-ayush-green"
                              : "border-ayush-border text-ayush-muted bg-ayush-card"
                          }`}
                        >
                          {optKey}
                        </div>
                        <span className="text-sm text-ayush-dark leading-snug pt-0.5">
                          {optLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Self-Rating 5-point Scale */
                <div className="space-y-3">
                  <p className="text-xs text-ayush-muted italic mb-2">
                    Select the level that best reflects your current clinical and practical confidence:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {currentQuestion.options?.map((opt) => {
                      const optVal = Number(opt.value ?? 1);
                      const optLabel = opt.label ?? opt.text ?? String(optVal);
                      const isSelected = Number(currentAnswer.answerValue) === optVal;
                      return (
                        <button
                          key={optVal}
                          type="button"
                          onClick={() => handleSelectAnswer(optVal, optLabel)}
                          className={`p-3.5 rounded-xl border text-center transition-all flex sm:flex-col items-center justify-between sm:justify-center gap-2 ${
                            isSelected
                              ? "border-ayush-green bg-ayush-sand/60 shadow-sm ring-2 ring-ayush-green"
                              : "border-ayush-border/70 bg-ayush-card/60 hover:bg-ayush-sand/30 hover:border-ayush-border"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              isSelected
                                ? "bg-ayush-green text-white"
                                : "bg-ayush-sand text-ayush-dark"
                            }`}
                          >
                            {optVal}
                          </div>
                          <span className="text-xs font-medium text-ayush-dark">
                            {optLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-ayush-border/40 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-2">
                  {currentIndex < totalQuestions - 1 ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="gap-1.5 bg-ayush-green hover:bg-ayush-green/90 text-white"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="gap-1.5 bg-ayush-saffron hover:bg-ayush-saffron/90 text-white"
                    >
                      <span>Review & Submit</span>
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Question Navigator Grid & Submit Trigger */}
        <div className="space-y-4">
          <Card className="border-ayush-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Question Navigator</CardTitle>
                <span className="text-[11px] text-ayush-muted">
                  {answeredCount}/{totalQuestions} Done
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const isAnswered = ans && ((ans.answerValue !== undefined && ans.answerValue !== null) || (ans.answerText !== undefined && ans.answerText !== null && ans.answerText !== ""));
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-8 rounded-lg text-xs font-medium transition-all relative flex items-center justify-center ${
                        isCurrent
                          ? "ring-2 ring-ayush-dark bg-ayush-dark text-white shadow-sm"
                          : isAnswered
                          ? "bg-ayush-green/15 border border-ayush-green/40 text-ayush-green hover:bg-ayush-green/25"
                          : "bg-ayush-sand/30 border border-ayush-border/60 text-ayush-muted hover:bg-ayush-sand/60"
                      }`}
                      title={`Q${idx + 1}: ${q.competency?.name || "Question"} (${isAnswered ? "Answered" : "Unanswered"})`}
                    >
                      {idx + 1}
                      {isAnswered && !isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ayush-green" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-ayush-border/40 flex items-center justify-between text-[11px] text-ayush-muted">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ayush-green" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ayush-sand border border-ayush-border" />
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Submit Button in Sidebar */}
              <div className="mt-4 pt-2">
                <Button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full gap-2 bg-ayush-dark text-white hover:bg-ayush-dark/90 text-xs py-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Finish & Submit</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => !isSubmitting && setIsSubmitModalOpen(false)}
        title="Confirm Assessment Submission"
        description="Please review your completion status before finalizing."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Back to Questions
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-ayush-green hover:bg-ayush-green/90 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Scores...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Submit</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          {unansweredCount > 0 ? (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You have {unansweredCount} unanswered questions remaining</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Unanswered questions will receive 0 points. We recommend reviewing the question navigator to answer all items before submitting.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All 26 questions answered</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Great job! You have answered all multiple choice and self-reflection questions.
              </p>
            </div>
          )}

          <div className="text-xs text-ayush-muted space-y-2 border-t border-ayush-border/40 pt-3">
            <p>
              Once you submit:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Your responses will be locked and cannot be edited.</li>
              <li>Your Platform Skill Profile Score will be calculated securely.</li>
              <li>Your competency profile will be updated and visualized immediately.</li>
            </ul>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs">
              {submitError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
