import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-ayush-border/90 bg-ayush-card px-3.5 py-2 text-sm text-ayush-dark shadow-warm transition-all duration-200 placeholder:text-ayush-muted file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ayush-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ayush-green focus-visible:border-ayush-green disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ayush-sand/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
