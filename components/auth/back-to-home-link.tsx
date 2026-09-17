import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToHomeLinkProps {
  className?: string;
}

export function BackToHomeLink({ className }: BackToHomeLinkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-ayush-muted hover:text-ayush-brown transition-all group px-2.5 py-1.5 -ml-2 rounded-lg hover:bg-ayush-sand/60",
        className,
      )}
      title="Return to VEDA SETU Home"
    >
      <ArrowLeft className="w-3.5 h-3.5 text-ayush-muted group-hover:text-ayush-brown transition-transform group-hover:-translate-x-1" />
      <span>Back to Home</span>
    </Link>
  );
}
