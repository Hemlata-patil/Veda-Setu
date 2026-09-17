import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LotusEmblem, HerbLeaf } from "@/components/ui/motifs";
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  BookOpen,
  Briefcase,
  Sparkles,
} from "lucide-react";

export function Hero() {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-ayush-border/80 bg-ayush-card shadow-warm-lg">
      {/* Manuscript-inspired Botanical Hero Artwork */}
      <div
        className="absolute inset-0 bg-cover bg-right sm:bg-center opacity-30 pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: "url('/images/ayush-hero-bg.jpg')" }}
      />

      {/* Subtle Warm Gradient Overlay for Maximum Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-ayush-card via-ayush-card/90 to-transparent pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 max-w-4xl">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-ayush-border bg-ayush-sand/60 px-3.5 py-1 text-xs font-semibold text-ayush-brown mb-6 shadow-sm">
          <LotusEmblem className="w-4 h-4 text-ayush-saffron" />
          <span>AYURVEDIC HERITAGE × MODERN DIGITAL</span>
          <span className="h-1 w-1 rounded-full bg-ayush-green" />
          <span className="text-[11px] text-ayush-muted font-normal">
            Academia & Industry Collaboration
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-ayush-dark leading-[1.1] mb-6">
          Connecting AYUSH Education with Real-World Opportunities
        </h1>

        {/* Description aligned with PS 26044 */}
        <p className="text-base sm:text-lg text-ayush-muted max-w-2xl leading-relaxed mb-8">
          A dedicated collaboration platform connecting Ayush academia and industry.
          Enabling skill assessment, gap analysis, personalized learning pathways,
          internships, collaborative research, and skill-based opportunity matching.
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ayush-dark mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ayush-border/70 bg-ayush-sand/40 px-3 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-ayush-green" />
            Skill Assessment & Mapping
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ayush-border/70 bg-ayush-sand/40 px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-ayush-saffron" />
            Institution Analytics
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ayush-border/70 bg-ayush-sand/40 px-3 py-1.5">
            <Briefcase className="w-3.5 h-3.5 text-ayush-brown" />
            Internships & Placement Opportunities
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <Button asChild size="lg" variant="default" className="gap-2">
            <Link href="/auth/sign-up">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="#how-it-works">
              <span>Explore Platform Features</span>
            </Link>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-ayush-border/60 text-xs text-ayush-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ayush-green" />
            <span>Verified Academic & Professional Records</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ayush-saffron" />
            <span>Skill-Based Opportunity Matching</span>
          </div>
          <div className="flex items-center gap-2">
            <HerbLeaf className="w-4 h-4 text-ayush-brown" />
            <span>Faculty Research & Industry Collaboration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
