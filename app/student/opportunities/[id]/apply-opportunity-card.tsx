"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { applyToOpportunity } from "@/app/student/applications/actions";
import { APPLICATION_STATUS_CONFIG, ApplicationStatus } from "@/lib/applications";
import { Send, CheckCircle2, ArrowRight, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ApplyOpportunityCardProps {
  opportunityId: string;
  existingApplication?: {
    id: string;
    status: string;
    applied_at: string;
  } | null;
}

export function ApplyOpportunityCard({
  opportunityId,
  existingApplication: initialApplication,
}: ApplyOpportunityCardProps) {
  const router = useRouter();
  const [coverNote, setCoverNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [application, setApplication] = React.useState(initialApplication || null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await applyToOpportunity({
        opportunityId,
        coverNote: coverNote.trim() || undefined,
      });

      if (res.success) {
        setApplication({
          id: res.applicationId,
          status: "applied",
          applied_at: new Date().toISOString(),
        });
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (application) {
    const statusCfg =
      APPLICATION_STATUS_CONFIG[application.status as ApplicationStatus] || {
        label: application.status,
        variant: "parchment",
        description: "Application on file.",
      };

    return (
      <Card accent="green" className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
              Application Status
            </span>
            <Badge variant={statusCfg.variant as any} className="text-xs capitalize">
              {statusCfg.label}
            </Badge>
          </div>

          <div className="rounded-xl bg-ayush-herbal/10 border border-ayush-herbal/20 p-4 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-ayush-herbal">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Application Submitted</span>
            </div>
            <p className="text-ayush-muted leading-relaxed pl-6">
              {statusCfg.description}
            </p>
          </div>

          <div className="pt-2">
            <Button asChild variant="default" className="w-full gap-2 text-xs">
              <Link href="/student/applications">
                <span>View Application</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-1">
        <h4 className="font-heading text-lg font-bold text-ayush-dark">
          Apply for Opportunity
        </h4>
        <p className="text-xs text-ayush-muted">
          Your verified Ayush competency scores will be automatically shared with the industry reviewer.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleApply} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
            Cover Note <span className="text-ayush-muted font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Briefly state your clinical interest, availability, or research motivations..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30 leading-relaxed"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 text-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? "Submitting Application..." : "Apply Now"}</span>
        </Button>
      </form>
    </Card>
  );
}
