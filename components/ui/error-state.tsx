import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Notice: Unable to load data",
  message = "A temporary connection interruption occurred. Traditional data records remain secure.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-ayush-terracotta/30 bg-ayush-card p-8 text-center shadow-warm",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ayush-terracotta/10 text-ayush-terracotta mb-4 border border-ayush-terracotta/20">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-ayush-dark mb-1">
        {title}
      </h3>
      <p className="text-xs text-ayush-muted max-w-sm leading-relaxed mb-4">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 text-ayush-terracotta border-ayush-terracotta/40 hover:bg-ayush-terracotta/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
