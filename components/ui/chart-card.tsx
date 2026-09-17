import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
  trend?: { value: string; positive?: boolean };
  periods?: string[];
  activePeriod?: string;
  onPeriodChange?: (period: string) => void;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  metric,
  metricLabel,
  trend,
  periods = ["Weekly", "Monthly", "Annual"],
  activePeriod = "Monthly",
  onPeriodChange,
  children,
  className,
  ...props
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ayush-border/80 bg-ayush-card p-6 shadow-warm transition-all",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-ayush-border/40">
        <div>
          <h3 className="font-heading text-lg font-semibold text-ayush-dark">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-ayush-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Timeframe selector */}
        {periods && (
          <div className="inline-flex rounded-lg border border-ayush-border/70 bg-ayush-sand/50 p-0.5 text-xs">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => onPeriodChange?.(period)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-all",
                  activePeriod === period
                    ? "bg-ayush-card text-ayush-brown shadow-sm font-semibold"
                    : "text-ayush-muted hover:text-ayush-dark",
                )}
              >
                {period}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {metric && (
        <div className="flex items-baseline gap-3 pt-4">
          <span className="font-heading text-3xl font-bold text-ayush-dark">
            {metric}
          </span>
          {metricLabel && (
            <span className="text-xs text-ayush-muted">{metricLabel}</span>
          )}
          {trend && (
            <Badge
              variant={trend.positive ? "herbal" : "destructive"}
              className="text-[11px] ml-auto"
            >
              {trend.value}
            </Badge>
          )}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="mt-4 min-h-[220px] w-full flex items-center justify-center rounded-xl bg-ayush-parchment/40 border border-dashed border-ayush-border/60 p-4">
        {children}
      </div>
    </div>
  );
}
