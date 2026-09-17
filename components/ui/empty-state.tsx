import * as React from "react";
import { cn } from "@/lib/utils";
import { HerbLeaf } from "@/components/ui/motifs";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = HerbLeaf,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ayush-border/90 bg-ayush-card/60 p-8 sm:p-12 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ayush-sand/70 text-ayush-green border border-ayush-border/50 mb-4 shadow-warm">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-ayush-dark mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-ayush-muted max-w-sm leading-relaxed mb-5">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
