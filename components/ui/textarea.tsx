import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[90px] w-full rounded-lg border border-ayush-border/90 bg-ayush-card px-3.5 py-2.5 text-sm text-ayush-dark shadow-warm transition-all duration-200 placeholder:text-ayush-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ayush-green focus-visible:border-ayush-green disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ayush-sand/30",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
