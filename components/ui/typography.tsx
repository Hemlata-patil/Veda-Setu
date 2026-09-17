import * as React from "react";
import { cn } from "@/lib/utils";

export function DisplayTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "font-heading text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-ayush-dark leading-[1.1]",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function PageTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-ayush-dark",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-heading text-xl sm:text-2xl font-semibold tracking-tight text-ayush-dark",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Eyebrow({
  className,
  children,
  color = "saffron",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  color?: "saffron" | "green" | "brown";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-2",
        color === "saffron" && "text-ayush-saffron",
        color === "green" && "text-ayush-green",
        color === "brown" && "text-ayush-brown",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          color === "saffron" && "bg-ayush-saffron",
          color === "green" && "bg-ayush-green",
          color === "brown" && "bg-ayush-brown",
        )}
      />
      {children}
    </div>
  );
}
