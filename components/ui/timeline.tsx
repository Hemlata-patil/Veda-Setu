import * as React from "react";
import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  date?: string;
  status: "completed" | "current" | "pending";
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative pl-6 space-y-8", className)}>
      {/* Vertical Track Line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-ayush-border/80" />

      {items.map((item) => {
        const isCompleted = item.status === "completed";
        const isCurrent = item.status === "current";
        const CustomIcon = item.icon;

        return (
          <div key={item.id} className="relative flex items-start gap-4 group">
            {/* Step Node Dot */}
            <div
              className={cn(
                "absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 bg-ayush-card",
                isCompleted && "border-ayush-green bg-ayush-green text-white shadow-sm",
                isCurrent && "border-ayush-saffron bg-ayush-card text-ayush-saffron ring-4 ring-ayush-saffron/20",
                item.status === "pending" && "border-ayush-border text-ayush-muted bg-ayush-sand/50",
              )}
            >
              {CustomIcon ? (
                <CustomIcon className="w-3 h-3" />
              ) : isCompleted ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : isCurrent ? (
                <Clock className="w-3 h-3 animate-pulse" />
              ) : (
                <Circle className="w-2 h-2 fill-current" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 rounded-xl border border-ayush-border/70 bg-ayush-card p-4 shadow-warm transition-all group-hover:border-ayush-border">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h4 className="font-heading text-base font-semibold text-ayush-dark">
                  {item.title}
                </h4>
                {item.date && (
                  <span className="text-xs text-ayush-muted font-medium">
                    {item.date}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-ayush-muted leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.badge && (
                <span className="inline-block mt-2 rounded bg-ayush-sand/80 px-2 py-0.5 text-[10px] font-semibold text-ayush-brown">
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
