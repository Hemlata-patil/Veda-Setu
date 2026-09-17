import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ayush-green focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-ayush-brown text-ayush-card border-transparent",
        herbal:
          "bg-ayush-green/15 text-ayush-green border border-ayush-green/25 font-semibold",
        saffron:
          "bg-ayush-saffron/15 text-ayush-saffron border border-ayush-saffron/30 font-semibold",
        parchment:
          "bg-ayush-sand text-ayush-dark border border-ayush-border/70",
        outline:
          "border border-ayush-border text-ayush-muted bg-ayush-card/50",
        destructive:
          "bg-ayush-terracotta/15 text-ayush-terracotta border border-ayush-terracotta/30 font-semibold",
        secondary:
          "bg-ayush-sand/80 text-ayush-brown border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "herbal" && "bg-ayush-green",
            variant === "saffron" && "bg-ayush-saffron",
            variant === "destructive" && "bg-ayush-terracotta",
            variant === "default" && "bg-ayush-card",
            (!variant || variant === "parchment" || variant === "outline") && "bg-ayush-muted",
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
