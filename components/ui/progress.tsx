import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "green" | "saffron" | "brown";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

export function Progress({
  value = 0,
  max = 100,
  variant = "green",
  size = "md",
  showLabel = false,
  label,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-ayush-dark">{label}</span>
          <span className="text-ayush-muted">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "w-full overflow-hidden rounded-full bg-ayush-sand/70 border border-ayush-border/40",
          size === "sm" && "h-1.5",
          size === "md" && "h-2.5",
          size === "lg" && "h-3.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variant === "green" && "bg-ayush-green",
            variant === "saffron" && "bg-ayush-saffron",
            variant === "brown" && "bg-ayush-brown",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
