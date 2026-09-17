import * as React from "react";
import { cn } from "@/lib/utils";
import { PageTitle, Eyebrow } from "@/components/ui/typography";

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowColor?: "saffron" | "green" | "brown";
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  borderBottom?: boolean;
}

export function PageHeader({
  eyebrow,
  eyebrowColor = "saffron",
  title,
  description,
  actions,
  className,
  borderBottom = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6",
        borderBottom && "border-b border-ayush-border/70 mb-6",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
        )}
        <PageTitle>{title}</PageTitle>
        {description && (
          <p className="text-sm text-ayush-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
