"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CompetencyActionPlan,
  RoadmapProgressStatus,
} from "@/lib/learning";
import {
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface RecommendationCardsProps {
  priorityAreas: CompetencyActionPlan[];
}

export function RecommendationCards({ priorityAreas }: RecommendationCardsProps) {
  // Local/UI state for progress status tracking (no new table needed)
  const [statuses, setStatuses] = React.useState<Record<string, RoadmapProgressStatus>>(() => {
    const initial: Record<string, RoadmapProgressStatus> = {};
    priorityAreas.forEach((item) => {
      initial[item.competencyId] = item.progressStatus;
    });
    return initial;
  });

  const cycleStatus = (id: string) => {
    setStatuses((prev) => {
      const current = prev[id] || "Not Started";
      let next: RoadmapProgressStatus = "In Progress";
      if (current === "Not Started") next = "In Progress";
      else if (current === "In Progress") next = "Ready to Demonstrate";
      else next = "Not Started";
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {priorityAreas.map((item) => {
        const currentStatus = statuses[item.competencyId] || item.progressStatus;
        const statusBadgeVariant =
          currentStatus === "Ready to Demonstrate"
            ? "herbal"
            : currentStatus === "In Progress"
            ? "saffron"
            : "parchment";

        return (
          <Card key={item.competencyId} className="flex flex-col justify-between p-5 space-y-4 hover:border-ayush-border/90 transition-all">
            <div className="space-y-3">
              {/* Header: Score & Category */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {item.category.replace(/_/g, " ")}
                </Badge>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-ayush-muted">Current:</span>
                  <span className="font-heading text-base font-bold text-amber-800">
                    {item.score}%
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="font-heading text-lg font-bold text-ayush-dark leading-snug">
                  {item.competencyName}
                </h4>
                {item.description && (
                  <p className="text-xs text-ayush-muted line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Why It Matters */}
              <div className="rounded-lg bg-ayush-sand/30 p-3 text-xs space-y-1 border border-ayush-border/40">
                <span className="font-semibold text-ayush-dark block">Why it matters:</span>
                <p className="text-ayush-muted leading-relaxed">
                  {item.whyItMatters}
                </p>
              </div>

              {/* Recommended Next Action */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-ayush-herbal flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended Next Action:
                </span>
                <p className="text-ayush-dark leading-relaxed pl-5">
                  {item.recommendedNextAction}
                </p>
              </div>
            </div>

            {/* Footer: Status Toggle & Interactive Badge */}
            <div className="pt-3 border-t border-ayush-border/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-ayush-muted uppercase tracking-wider block">
                  Status
                </span>
                <Badge variant={statusBadgeVariant as any} className="text-[11px] capitalize">
                  {currentStatus}
                </Badge>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => cycleStatus(item.competencyId)}
                className="text-xs h-7 px-2 text-ayush-muted hover:text-ayush-dark"
                title="Click to advance status"
              >
                <span>Update Status</span>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
