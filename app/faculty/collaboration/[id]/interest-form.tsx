"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { expressInterest } from "../actions";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function OpportunityInterestForm({ opportunityId }: { opportunityId: string }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    const res = await expressInterest(opportunityId, message);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({ type: "success", text: res.message || "Interest submitted successfully!" });
      router.refresh();
    } else {
      setStatusMsg({ type: "error", text: res.error || "Failed to submit interest." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ayush-text block">
          Statement / Research Note (Optional)
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Briefly state your academic focus, relevant clinical cases, or research interests..."
          rows={3}
          className="text-xs resize-none"
          disabled={isSubmitting}
        />
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="saffron"
        size="sm"
        disabled={isSubmitting}
        className="w-full text-xs flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            <span>Express Interest</span>
          </>
        )}
      </Button>
    </form>
  );
}
