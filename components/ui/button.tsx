import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ayush-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-ayush-brown text-ayush-card shadow-warm hover:bg-ayush-brown/90 hover:shadow-warm-md",
        secondary:
          "bg-ayush-green text-ayush-card shadow-warm hover:bg-ayush-green/90 hover:shadow-warm-md",
        saffron:
          "bg-ayush-saffron text-white shadow-warm hover:bg-ayush-saffron/90 hover:shadow-warm-md",
        outline:
          "border border-ayush-border bg-ayush-card text-ayush-brown hover:bg-ayush-sand/50 hover:text-ayush-dark shadow-warm",
        ghost:
          "text-ayush-dark hover:bg-ayush-sand/60 hover:text-ayush-brown",
        link:
          "text-ayush-brown underline-offset-4 hover:underline hover:text-ayush-saffron p-0 h-auto",
        heritage:
          "border border-ayush-saffron/70 bg-ayush-card text-ayush-brown hover:border-ayush-saffron hover:bg-ayush-sand/40 shadow-warm font-heading text-base tracking-wide",
        destructive:
          "bg-ayush-terracotta text-white shadow-warm hover:bg-ayush-terracotta/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
