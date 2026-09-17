import { Hero } from "@/components/hero";
import {
  HowItWorksSection,
  StakeholdersSection,
  ProblemSection,
  EndToEndJourneySection,
  FinalCtaSection,
} from "@/components/landing-sections";
import { AuthButton } from "@/components/auth-button";
import { LotusEmblem, HerbLeaf } from "@/components/ui/motifs";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/layout/brand-logo";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ShieldCheck, Code2 } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col bg-transparent text-ayush-dark overflow-x-hidden selection:bg-ayush-saffron/20 selection:text-ayush-dark">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full border-b border-ayush-border/80 bg-ayush-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-8">
          {/* Brand Logo with Hidden 5-Click Trigger */}
          <BrandLogo subtitle="Academia–Industry Platform" />

          {/* Center: Collaboration Platform Badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-ayush-border/70 bg-ayush-sand/40 px-3.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-ayush-green" />
            <span className="text-xs text-ayush-muted font-medium">
              Ayush Academia & Industry Collaboration Platform
            </span>
          </div>

          {/* Right: Auth Controls */}
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="h-9 w-20 rounded-md bg-ayush-sand/60 animate-pulse" />}>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* 3. Main Landing Page Sections Flow */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-20 sm:space-y-28">
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: How It Works */}
        <div id="how-it-works">
          <HowItWorksSection />
        </div>

        {/* Section 3: 4 Stakeholders (Students | Faculty | Institutions | Industry) */}
        <StakeholdersSection />

        {/* Section 4: The Problem */}
        <ProblemSection />

        {/* Section 5: End-to-End Journey */}
        <EndToEndJourneySection />

        {/* Section 6: Final Call to Action */}
        <FinalCtaSection />
      </div>

      {/* 4. Dignified Ayush Heritage Footer */}
      <footer className="relative z-10 w-full border-t border-ayush-border/80 bg-ayush-card/85 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/veda-setu-logo.png"
              alt="Veda Setu"
              width={160}
              height={50}
              className="h-9 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-heading text-base font-semibold text-ayush-dark">
                VEDA SETU — Academia–Industry Collaboration Platform
              </span>
              <span className="text-xs text-ayush-muted">
                "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः" — Dedicated to Holistic Healthcare & Ayurvedic Excellence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-ayush-muted">
            <span className="flex items-center gap-1">
              <HerbLeaf className="w-3.5 h-3.5 text-ayush-green" />
              Evidence-Based Ayurveda
            </span>
            <span>·</span>
            <Link
              href="/dev/design-system"
              className="inline-flex items-center gap-1.5 text-ayush-muted hover:text-ayush-brown transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-ayush-saffron" />
              <span>Design System (Dev)</span>
            </Link>
            <span>·</span>
            <span className="font-mono text-[11px]">v1.0 Production Ready</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
