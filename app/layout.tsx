import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { GlobalBackground } from "@/components/layout/global-background";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "VEDA SETU — Connecting AYUSH Education with Real-World Opportunities",
  description:
    "Bridging traditional Ayurvedic wisdom and modern clinical, research, and industry opportunities. Connecting students, faculty, institutions, and enterprises.",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-transparent text-foreground font-sans antialiased selection:bg-ayush-saffron/20 selection:text-ayush-dark">
        {/* Unified Global Ayurvedic Background Layer */}
        <GlobalBackground />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
