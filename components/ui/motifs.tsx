import * as React from "react";
import { cn } from "@/lib/utils";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Ayurvedic Lotus Emblem: Symbolizes knowledge, purity, and clinical excellence.
 */
export function LotusEmblem({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <path
        d="M24 6C24 6 29 16 29 25C29 31 26.5 35 24 37C21.5 35 19 31 19 25C19 16 24 6 24 6Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 18C28 17 38 18 41 27C42.5 31.5 39 36 34 36C29 36 25 31 24 29"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M24 18C20 17 10 18 7 27C5.5 31.5 9 36 14 36C19 36 23 31 24 29"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M24 27C30 27 38 29 40 37C39 40 32 42 24 42C16 42 9 40 8 37C10 29 18 27 24 27Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Ayurvedic Herb Leaf (Tulsi / Medicinal Plant Motif)
 */
export function HerbLeaf({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-5 h-5", className)}
      {...props}
    >
      <path d="M12 22C12 22 20 18 20 10C20 4 14 2 12 2C10 2 4 4 4 10C4 18 12 22 12 22Z" />
      <path d="M12 2V22" />
      <path d="M12 8C14.5 9.5 17 9 17 9" />
      <path d="M12 13C15 14 18 13.5 18 13.5" />
      <path d="M12 8C9.5 9.5 7 9 7 9" />
      <path d="M12 13C9 14 6 13.5 6 13.5" />
    </svg>
  );
}

/**
 * Mortar & Pestle (Formulation & Traditional Research)
 */
export function MortarPestle({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-5 h-5", className)}
      {...props}
    >
      <path d="M4 11H20C20 16.5 16.5 20 12 20C7.5 20 4 16.5 4 11Z" />
      <path d="M19 4L11 12" />
      <path d="M6 21H18" />
    </svg>
  );
}

/**
 * Heritage Ornamental Divider with subtle central floral bindu
 */
export function HeritageDivider({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("relative flex items-center justify-center my-6", className)}>
      <div className="flex-grow border-t border-ayush-border/80" />
      <div className="px-4 flex items-center gap-2 text-xs uppercase tracking-widest text-ayush-muted font-serif">
        <span className="inline-block w-1.5 h-1.5 rotate-45 bg-ayush-saffron" />
        {label ? <span>{label}</span> : <HerbLeaf className="w-4 h-4 text-ayush-green inline-block" />}
        <span className="inline-block w-1.5 h-1.5 rotate-45 bg-ayush-saffron" />
      </div>
      <div className="flex-grow border-t border-ayush-border/80" />
    </div>
  );
}
