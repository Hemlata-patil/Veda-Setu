import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompetencyActionPlan } from "@/lib/learning";
import { Check, Clock, Compass, BookOpen, Award, CheckCircle2, ArrowRight } from "lucide-react";

interface RoadmapViewProps {
  priorityAreas: CompetencyActionPlan[];
}

export function RoadmapView({ priorityAreas }: RoadmapViewProps) {
  if (priorityAreas.length === 0) {
    return (
      <Card className="p-8 text-center bg-ayush-herbal/5 border-ayush-herbal/20">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ayush-herbal/10 text-ayush-herbal">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="font-heading text-lg font-bold text-ayush-dark">
              All Evaluated Competencies Above Benchmark
            </h4>
            <p className="text-xs text-ayush-muted leading-relaxed">
              You do not have any competencies currently scoring below 60%. Your development path focuses on Stage 3: advanced clinical application, research publication, and industry project demonstration.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const stages = [
    {
      stageNumber: 1,
      title: "Stage 1: Strengthen Foundations",
      subtitle: "Focus on classical conceptual mastery, core terminology, and biostatistical literacy.",
      icon: BookOpen,
      badgeVariant: "herbal" as const,
      getAction: (item: CompetencyActionPlan) => item.stage1Action,
    },
    {
      stageNumber: 2,
      title: "Stage 2: Practice & Apply",
      subtitle: "Engage in supervised clinical exercises, trial dataset reviews, and patient regimen structuring.",
      icon: Compass,
      badgeVariant: "saffron" as const,
      getAction: (item: CompetencyActionPlan) => item.stage2Action,
    },
    {
      stageNumber: 3,
      title: "Stage 3: Demonstrate & Build Evidence",
      subtitle: "Deliver verified outcomes through case presentations, research audits, and industry collaborations.",
      icon: Award,
      badgeVariant: "parchment" as const,
      getAction: (item: CompetencyActionPlan) => item.stage3Action,
    },
  ];

  return (
    <div className="space-y-6">
      {stages.map((stage) => {
        const IconComponent = stage.icon;

        return (
          <div
            key={stage.stageNumber}
            className="rounded-2xl border border-ayush-border/80 bg-ayush-card p-6 shadow-sm space-y-4 hover:border-ayush-border transition-all"
          >
            {/* Stage Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ayush-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ayush-sand/80 text-ayush-brown border border-ayush-border/60">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading text-lg font-bold text-ayush-dark">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-ayush-muted">
                    {stage.subtitle}
                  </p>
                </div>
              </div>
              <Badge variant={stage.badgeVariant} className="self-start sm:self-auto text-xs">
                Milestone 0{stage.stageNumber}
              </Badge>
            </div>

            {/* Targeted Actions for Priority Competencies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {priorityAreas.map((item) => (
                <div
                  key={item.competencyId}
                  className="rounded-xl bg-ayush-sand/30 border border-ayush-border/50 p-4 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ayush-dark">
                        {item.competencyName}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800">
                        {item.score}%
                      </span>
                    </div>
                    <p className="text-xs text-ayush-dark leading-relaxed">
                      {stage.getAction(item)}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-[10px] text-ayush-muted uppercase tracking-wider font-semibold">
                    <span>Target Outcome</span>
                    <ArrowRight className="w-3 h-3 text-ayush-brown/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
