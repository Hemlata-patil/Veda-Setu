"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startAssessment } from "./actions";

export function StartAssessmentButton({ templateId }: { templateId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await startAssessment(templateId);
      if (res?.attemptId) {
        router.push(`/student/assessment/${res.attemptId}`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start assessment. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleStart}
        disabled={loading}
        className="w-full gap-2 bg-ayush-green hover:bg-ayush-green/90 text-white shadow-warm transition-all hover:translate-y-[-1px]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Starting Assessment...</span>
          </>
        ) : (
          <>
            <span>Begin Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
