import { DesignSystemPreview } from "@/components/design-system-preview";
import { LotusEmblem } from "@/components/ui/motifs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Design System Showcase — VEDA SETU (Dev Route)",
  description: "Internal preview of tokens, typography, components, and layout blocks for developers.",
};

export default function DesignSystemDevPage() {
  return (
    <main className="min-h-screen bg-ayush-parchment text-ayush-dark">
      {/* Dev Header */}
      <nav className="sticky top-0 z-40 w-full border-b border-ayush-border/80 bg-ayush-card/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-xs text-ayush-muted hover:text-ayush-dark transition-colors mr-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ayush-brown text-ayush-card">
              <LotusEmblem className="w-5 h-5 text-ayush-saffron" />
            </div>
            <span className="font-heading text-base font-bold text-ayush-dark">
              Ayush Design System
            </span>
            <Badge variant="saffron" className="text-[10px]">
              Dev Route
            </Badge>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/">Public Home</Link>
          </Button>
        </div>
      </nav>

      {/* Showcase Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <DesignSystemPreview />
      </div>
    </main>
  );
}
