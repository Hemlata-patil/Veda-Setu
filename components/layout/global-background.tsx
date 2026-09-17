import * as React from "react";

/**
 * GlobalBackground
 * Unified Ayurvedic visual identity layer across the entire VEDA SETU platform:
 * - Landing Page
 * - Student Portal
 * - Faculty Portal
 * - Institution Portal
 * - Industry Portal
 * - Super Admin Portal
 *
 * Implements:
 * 1. Deep parchment fallback (#F5EFE3)
 * 2. Newly provided Ayurveda photograph (herbs, mortar & pestle, powders, manuscripts)
 *    at background-size: cover, background-position: center, background-repeat: no-repeat.
 * 3. Soft warm cream/ivory readability overlay (preserving vivid recognizable details
 *    while ensuring contrast for all UI content).
 * 4. Fixed positioning so it remains visible while scrolling without layout shifts or distortion.
 */
export function GlobalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Base Warm Parchment Foundation */}
      <div className="absolute inset-0 bg-[#F5EFE3]" />

      {/* 2. Global Ayurveda Photograph Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
        style={{
          backgroundImage: "url('/images/ayush-global-bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      />

      {/* 3. Soft Warm Cream / Ivory Readability Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE3]/70 via-[#F5EFE3]/65 to-[#F5EFE3]/72" />
    </div>
  );
}
