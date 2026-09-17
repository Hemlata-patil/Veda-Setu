"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createOpportunity } from "../actions";
import { OpportunityType, WorkMode } from "@/lib/opportunities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, CheckCircle2, FileText, Award, AlertCircle } from "lucide-react";

interface CompetencyOption {
  id: string;
  name: string;
  category: string;
  description?: string | null;
}

interface NewOpportunityFormProps {
  competencies: CompetencyOption[];
  defaultOrgName?: string;
}

export function NewOpportunityForm({
  competencies,
  defaultOrgName = "",
}: NewOpportunityFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [opportunityType, setOpportunityType] = React.useState<OpportunityType>("internship");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [workMode, setWorkMode] = React.useState<WorkMode>("onsite");
  const [eligibility, setEligibility] = React.useState("");
  const [applicationDeadline, setApplicationDeadline] = React.useState("");
  const [organizationName, setOrganizationName] = React.useState(defaultOrgName);

  // Selected competencies state: mapping of competencyId -> requiredScore
  const [selectedCompetencies, setSelectedCompetencies] = React.useState<
    Array<{ competencyId: string; requiredScore: number; weight: number }>
  >([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Toggle competency selection
  const handleToggleCompetency = (compId: string) => {
    setSelectedCompetencies((prev) => {
      const exists = prev.find((c) => c.competencyId === compId);
      if (exists) {
        return prev.filter((c) => c.competencyId !== compId);
      } else {
        return [...prev, { competencyId: compId, requiredScore: 60, weight: 1 }];
      }
    });
  };

  const handleScoreChange = (compId: string, score: number) => {
    setSelectedCompetencies((prev) =>
      prev.map((c) =>
        c.competencyId === compId
          ? { ...c, requiredScore: Math.min(100, Math.max(0, score)) }
          : c
      )
    );
  };

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please enter an opportunity title.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Please provide a description for this opportunity.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createOpportunity({
        title,
        description,
        opportunityType,
        location: location.trim() || undefined,
        workMode,
        eligibility: eligibility.trim() || undefined,
        applicationDeadline: applicationDeadline || undefined,
        organizationName: organizationName.trim() || undefined,
        status: targetStatus,
        requiredCompetencies: selectedCompetencies,
      });

      router.push("/industry/opportunities");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create opportunity. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Group competencies by category for easy selection
  const groupedCompetencies = React.useMemo(() => {
    const map: Record<string, CompetencyOption[]> = {};
    competencies.forEach((comp) => {
      const cat = comp.category || "General";
      if (!map[cat]) map[cat] = [];
      map[cat].push(comp);
    });
    return map;
  }, [competencies]);

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Basic Opportunity Details */}
      <Card className="p-6 space-y-5">
        <h3 className="font-heading text-lg font-semibold text-ayush-dark">
          1. Opportunity Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Opportunity Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clinical Research Fellow in Dravyaguna"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Opportunity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value as OpportunityType)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30 capitalize"
            >
              <option value="internship">Internship</option>
              <option value="project">Project</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="entry_level_job">Entry Level Job</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Work Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30 capitalize"
            >
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Location / City
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New Delhi, Bengaluru, Haridwar"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Application Deadline
            </label>
            <input
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Organization Name
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Dabur Research & Development, AIIA Clinical Wing"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the opportunity objectives, tasks, responsibilities, and mentorship environment..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-ayush-dark uppercase tracking-wider">
              Eligibility Criteria
            </label>
            <input
              type="text"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="e.g. 3rd/4th Year BAMS students, Post-graduates or completed Shishiksha internship"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-ayush-border bg-white focus:outline-none focus:ring-2 focus:ring-ayush-herbal/30"
            />
          </div>
        </div>
      </Card>

      {/* Required Competencies Configuration */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg font-semibold text-ayush-dark">
              2. Required Ayush Competencies
            </h3>
            <p className="text-xs text-ayush-muted">
              Select key competencies required for this opportunity and set the minimum required score (0–100, default 60).
            </p>
          </div>
          <Badge variant="parchment" className="self-start sm:self-auto">
            {selectedCompetencies.length} Selected
          </Badge>
        </div>

        {/* Selected List with Score Sliders/Inputs */}
        {selectedCompetencies.length > 0 && (
          <div className="rounded-lg border border-ayush-border/80 bg-ayush-sand/30 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ayush-dark">
              Configured Requirements
            </h4>
            <div className="divide-y divide-ayush-border/60">
              {selectedCompetencies.map((item) => {
                const comp = competencies.find((c) => c.id === item.competencyId);
                if (!comp) return null;

                return (
                  <div key={item.competencyId} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ayush-dark">{comp.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {comp.category?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-ayush-muted whitespace-nowrap">
                          Required Score:
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.requiredScore}
                          onChange={(e) => handleScoreChange(item.competencyId, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm text-center font-semibold rounded border border-ayush-border bg-white focus:outline-none focus:ring-1 focus:ring-ayush-herbal"
                        />
                        <span className="text-xs text-ayush-muted">/ 100</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCompetency(item.competencyId)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove requirement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Competency Pool Selection */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ayush-muted">
            Available Platform Competencies (Select to add):
          </h4>

          {Object.entries(groupedCompetencies).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h5 className="text-xs font-semibold text-ayush-dark/80 capitalize border-b border-ayush-border/50 pb-1">
                {category.replace(/_/g, " ")}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((comp) => {
                  const isSelected = selectedCompetencies.some((c) => c.competencyId === comp.id);
                  return (
                    <div
                      key={comp.id}
                      onClick={() => handleToggleCompetency(comp.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? "border-ayush-herbal bg-ayush-herbal/10"
                          : "border-ayush-border/70 bg-white hover:border-ayush-border hover:bg-ayush-sand/20"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-ayush-dark flex items-center gap-1.5">
                          {comp.name}
                        </div>
                        {comp.description && (
                          <p className="text-[11px] text-ayush-muted line-clamp-1">
                            {comp.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-ayush-herbal" />
                        ) : (
                          <PlusCircle className="w-4 h-4 text-ayush-muted hover:text-ayush-dark" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push("/industry/opportunities")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => handleSubmit("draft")}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Save Draft</span>
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={isSubmitting}
          onClick={() => handleSubmit("published")}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Publish Opportunity</span>
        </Button>
      </div>
    </div>
  );
}
