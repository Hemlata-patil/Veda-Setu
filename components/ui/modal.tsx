"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = "md",
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop with subtle parchment tint and blur */}
      <div
        className="fixed inset-0 bg-ayush-dark/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={cn(
          "relative w-full rounded-2xl border border-ayush-border bg-ayush-card text-ayush-dark shadow-warm-lg transition-all transform z-10 overflow-hidden",
          maxWidth === "sm" && "max-w-sm",
          maxWidth === "md" && "max-w-md",
          maxWidth === "lg" && "max-w-lg",
          maxWidth === "xl" && "max-w-2xl",
          className,
        )}
      >
        {/* Subtle top heritage accent */}
        <div className="h-1 w-full bg-gradient-to-r from-ayush-green via-ayush-saffron to-ayush-brown" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-ayush-border/50">
          <div className="space-y-1 pr-6">
            <h2 className="font-heading text-2xl font-semibold text-ayush-dark tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-ayush-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ayush-muted hover:bg-ayush-sand/60 hover:text-ayush-dark transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-ayush-dark leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-ayush-border/50 bg-ayush-sand/30 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
