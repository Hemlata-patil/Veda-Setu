"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  variant?: "pill" | "underline";
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({
  value,
  onValueChange,
  children,
  variant = "pill",
  className,
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange, variant }}>
      <div className={cn("w-full space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  const isPill = context?.variant !== "underline";

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1",
        isPill
          ? "rounded-xl border border-ayush-border/80 bg-ayush-sand/50 p-1 text-ayush-muted"
          : "border-b border-ayush-border/80 w-full gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  icon: Icon,
  className,
}: {
  value: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be inside Tabs");

  const isSelected = context.value === value;
  const isPill = context.variant !== "underline";

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      onClick={() => context.onChange(value)}
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none",
        isPill
          ? cn(
              "rounded-lg px-3.5 py-1.5",
              isSelected
                ? "bg-ayush-card text-ayush-brown shadow-warm font-semibold"
                : "text-ayush-muted hover:text-ayush-dark hover:bg-ayush-card/40",
            )
          : cn(
              "py-2.5 px-1 border-b-2 -mb-[2px]",
              isSelected
                ? "border-ayush-green text-ayush-green font-semibold"
                : "border-transparent text-ayush-muted hover:text-ayush-dark hover:border-ayush-border",
            ),
        className,
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be inside Tabs");

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn("focus-visible:outline-none animate-in fade-in-50 duration-200", className)}
    >
      {children}
    </div>
  );
}
