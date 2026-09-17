import * as React from "react";

/**
 * BotanicalBackground
 * A subtle, elegant Ayurvedic botanical and manuscript vector layer.
 * Rendered at 5-8% opacity with mix-blend-multiply over the parchment background (#F5EFE3).
 * Non-repeating, positioned along margins to maintain maximum readability for modern SaaS cards.
 */
export function BotanicalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
    >
      {/* 1. Top Right Botanical Line-Art: Tulsi & Herbal Flora */}
      <svg
        className="absolute top-12 -right-16 w-96 h-96 sm:w-[480px] sm:h-[480px] text-ayush-green opacity-[0.06] mix-blend-multiply transition-opacity"
        viewBox="0 0 400 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path d="M200 380 C200 300 230 180 320 80" strokeLinecap="round" />
        <path d="M240 240 C280 230 320 200 340 160 C320 180 280 190 240 240 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M220 280 C180 270 140 240 120 200 C140 220 180 230 220 280 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M260 180 C300 170 330 140 345 110 C330 130 295 140 260 180 Z" fill="currentColor" fillOpacity="0.1" />
        <path d="M250 140 C280 130 310 100 320 70 C310 90 280 100 250 140 Z" fill="currentColor" fillOpacity="0.1" />
        <circle cx="320" cy="80" r="3" fill="currentColor" />
        <circle cx="335" cy="65" r="2.5" fill="currentColor" />
        <circle cx="345" cy="55" r="2" fill="currentColor" />
      </svg>

      {/* 2. Upper Mid Left: Subtle Lotus & Water Lines */}
      <svg
        className="absolute top-[820px] -left-20 w-80 h-80 sm:w-[420px] sm:h-[420px] text-ayush-brown opacity-[0.05] mix-blend-multiply"
        viewBox="0 0 400 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {/* Central Petal */}
        <path d="M200 120 C180 170 180 230 200 260 C220 230 220 170 200 120 Z" />
        {/* Side Petals */}
        <path d="M200 180 C140 170 100 210 110 250 C140 260 180 230 200 220" />
        <path d="M200 180 C260 170 300 210 290 250 C260 260 220 230 200 220" />
        {/* Outer Lotus Leaf Petals */}
        <path d="M200 220 C130 230 80 270 100 300 C140 300 180 270 200 250" />
        <path d="M200 220 C270 230 320 270 300 300 C260 300 220 270 200 250" />
        {/* Calyx & Water ripples */}
        <path d="M120 310 C160 320 240 320 280 310" strokeLinecap="round" strokeDasharray="4 6" />
        <path d="M140 325 C170 332 230 332 260 325" strokeLinecap="round" strokeDasharray="3 5" />
      </svg>

      {/* 3. Mid Right: Faint Manuscript Calligraphy Motif Watermark */}
      <div className="absolute top-[1480px] right-8 lg:right-16 text-ayush-brown opacity-[0.04] select-none font-serif text-6xl sm:text-8xl tracking-widest pointer-events-none mix-blend-multiply">
        आयुर्वेद
      </div>

      {/* 4. Mid Section Left: Ashwagandha Medicinal Branch Line-Art */}
      <svg
        className="absolute top-[2100px] -left-16 w-80 h-96 sm:w-[400px] sm:h-[480px] text-ayush-green opacity-[0.055] mix-blend-multiply"
        viewBox="0 0 350 450"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M180 440 C170 340 210 260 160 150 C140 100 110 60 70 30" strokeLinecap="round" />
        {/* Ashwagandha leaves pair */}
        <path d="M185 360 C230 340 260 310 270 270 C240 280 200 320 185 360 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M175 330 C130 310 90 280 90 240 C120 250 160 290 175 330 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M175 250 C215 230 240 200 245 160 C220 170 190 210 175 250 Z" fill="currentColor" fillOpacity="0.08" />
        <path d="M155 210 C115 195 85 160 85 125 C110 135 140 175 155 210 Z" fill="currentColor" fillOpacity="0.08" />
        {/* Calyx & Berry Nodes */}
        <circle cx="210" cy="285" r="8" strokeDasharray="2 3" />
        <circle cx="210" cy="285" r="3" fill="currentColor" />
        <circle cx="130" cy="265" r="7" strokeDasharray="2 3" />
        <circle cx="130" cy="265" r="2.5" fill="currentColor" />
      </svg>

      {/* 5. Lower Right: Faint Sanskrit Aphorism Watermark */}
      <div className="absolute top-[2800px] right-6 lg:right-12 text-ayush-saffron opacity-[0.04] select-none font-serif text-5xl sm:text-7xl tracking-wider pointer-events-none mix-blend-multiply">
        स्वास्थ्यम्
      </div>

      {/* 6. Lower Left: Geometric Bindu & Heritage Diamond Accent */}
      <svg
        className="absolute top-[3400px] -left-10 w-72 h-72 text-ayush-brown opacity-[0.045] mix-blend-multiply"
        viewBox="0 0 300 300"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="50" y="50" width="200" height="200" rx="100" strokeDasharray="6 6" />
        <rect x="75" y="75" width="150" height="150" transform="rotate(45 150 150)" />
        <circle cx="150" cy="150" r="30" />
        <circle cx="150" cy="150" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}
