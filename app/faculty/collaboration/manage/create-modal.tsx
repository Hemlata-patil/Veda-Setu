"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createFacultyOpportunity } from "../actions";
import { PlusCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateOpportunityModal({
  profile,
  triggerText = "Create Opportunity",
}: {
  profile: any;
  triggerText?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    opportunity_type: "fdp" as "fdp" | "workshop" | "research_project" | "industry_collaboration",
    provider_name: "",
    location: "",
    mode: "hybrid" as "onsite" | "hybrid" | "remote",
    start_date: "",
    end_date: "",
    application_deadline: "",
    external_url: "",
    status: "published" as "draft" | "published",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createFacultyOpportunity({
      ...formData,
      organization_id: profile?.institution_id || profile?.organization_id,
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.error || "Failed to create opportunity.");
    }
  }

  return (
    <>
      <Button
        variant="saffron"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs"
      >
        <PlusCircle className="w-4 h-4" />
        <span>{triggerText}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-ayush-parchment/40 rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-ayush-text-muted hover:text-ayush-text"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-serif font-bold text-ayush-text mb-1">
              Create Faculty Opportunity
            </h3>
            <p className="text-xs text-ayush-text-muted mb-4">
              Draft or publish a Faculty Development Program, Workshop, or Research Project.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-ayush-text">Opportunity Title *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Advanced Ayurvedic Pharmacology FDP"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Type *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    value={formData.opportunity_type}
                    onChange={(e: any) => setFormData({ ...formData, opportunity_type: e.target.value })}
                  >
                    <option value="fdp">FDP (Faculty Development)</option>
                    <option value="workshop">Workshop / Training</option>
                    <option value="research_project">Research Project</option>
                    <option value="industry_collaboration">Industry Collaboration</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Delivery Mode</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    value={formData.mode}
                    onChange={(e: any) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ayush-text">Description / Objectives *</label>
                <Textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed curriculum, prerequisites, research scope, or collaboration goals..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Provider / Host Name</label>
                  <Input
                    value={formData.provider_name}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    placeholder="e.g. National Institute of Ayurveda"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Jaipur, Rajasthan / Online"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Start Date</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">End Date</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-ayush-text">Deadline</label>
                  <Input
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ayush-text">External URL / Syllabus Link</label>
                <Input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ayush-text">Initial Publication Status</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  value={formData.status}
                  onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="published">Publish Immediately</option>
                  <option value="draft">Save as Draft</option>
                </select>
              </div>

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
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{formData.status === "published" ? "Publish Opportunity" : "Save Draft"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
