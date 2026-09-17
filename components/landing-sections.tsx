import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LotusEmblem, HerbLeaf, HeritageDivider } from "@/components/ui/motifs";
import {
  BookOpen,
  GraduationCap,
  Building2,
  Briefcase,
  CheckCircle2,
  Compass,
  Network,
  ArrowRight,
  ShieldCheck,
  Award,
  Route,
} from "lucide-react";

/**
 * 1. HOW IT WORKS SECTION
 * Aligned with Skill Assessment, Mapping, Personalized Learning & Opportunity Matching
 */
export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Skill Assessment & Mapping",
      description:
        "Assess existing proficiencies across Ayush disciplines, identify skill gaps against industry requirements, and build a standardized digital portfolio.",
      icon: Compass,
      tag: "Assessment",
    },
    {
      number: "02",
      title: "Personalized Learning & Roadmap",
      description:
        "Receive adaptive recommendations, targeted learning modules, and mentorship pathways to bridge identified skill gaps.",
      icon: Route,
      tag: "Adaptive Growth",
    },
    {
      number: "03",
      title: "Internships & Live Projects",
      description:
        "Engage in structured internships, clinical training rotations, and collaborative research projects with participating Ayush industry partners.",
      icon: Network,
      tag: "Practical Training",
    },
    {
      number: "04",
      title: "Smart Matching & Placement",
      description:
        "Leverage skill-based opportunity matching to connect qualified scholars and practitioners with relevant career and research placements.",
      icon: Award,
      tag: "Career Opportunities",
    },
  ];

  return (
    <section className="w-full space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <HeritageDivider label="Platform Workflow" />
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-ayush-dark">
          How Veda Setu Works
        </h2>
        <p className="text-sm text-ayush-muted leading-relaxed">
          A structured framework guiding students and practitioners from initial skill evaluation to personalized development and industry opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={idx} hoverable className="relative overflow-hidden group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-2xl font-bold text-ayush-saffron font-serif">
                    {step.number}
                  </span>
                  <Badge variant="parchment" className="text-[10px]">
                    {step.tag}
                  </Badge>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ayush-sand/70 text-ayush-brown border border-ayush-border/60 mb-3 group-hover:bg-ayush-brown group-hover:text-ayush-card transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed text-ayush-muted">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/**
 * 2. THE 4 STAKEHOLDERS SECTION
 * Students | Faculty | Institutions | Industry
 */
export function StakeholdersSection() {
  const stakeholders = [
    {
      role: "Students & Scholars",
      badge: "Learners & Practitioners",
      icon: BookOpen,
      accent: "green" as const,
      features: [
        "Skill assessment and dynamic skill gap analysis against industry needs",
        "Secure digital portfolio and academic logbook tracking learning milestones",
        "Direct applications to verified industry internships, apprenticeships, and projects",
        "Personalized learning recommendations and adaptive career roadmaps",
      ],
    },
    {
      role: "Faculty & Mentors",
      badge: "Academic Mentors",
      icon: GraduationCap,
      accent: "saffron" as const,
      features: [
        "Participation in Faculty Development Programs (FDP) and specialized workshops",
        "Collaborative research opportunities with Ayush industry organizations",
        "Digital validation of student project submissions and clinical competencies",
        "Mentor endorsements and academic progress monitoring",
      ],
    },
    {
      role: "Institutions & Colleges",
      badge: "Ayush Academia",
      icon: Building2,
      accent: "brown" as const,
      features: [
        "Institution analytics and cohort skill progression dashboards",
        "Curriculum alignment insights based on aggregate skill gap data",
        "Management of industry partnerships, joint initiatives, and MoUs",
        "Comprehensive tracking of student internship placements and outcomes",
      ],
    },
    {
      role: "Industry & Organizations",
      badge: "Ayush Industry Partners",
      icon: Briefcase,
      accent: "green" as const,
      features: [
        "Participation across Ayush sectors: healthcare, wellness, manufacturing, and R&D",
        "Publication of internship, project, and placement opportunities",
        "Skill-based opportunity matching to discover qualified candidates",
        "Collaborative joint research and testing initiatives with academic faculty",
      ],
    },
  ];

  return (
    <section className="w-full space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <HeritageDivider label="Ecosystem Stakeholders" />
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-ayush-dark">
          Empowering the Entire Ayush Community
        </h2>
        <p className="text-sm text-ayush-muted leading-relaxed">
          Tailored interfaces and workflows designed to meet the distinct needs of students, educators, academic institutions, and industry partners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stakeholders.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} accent={s.accent} hoverable className="flex flex-col justify-between">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ayush-sand/80 text-ayush-brown border border-ayush-border/70">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{s.role}</CardTitle>
                      <span className="text-xs text-ayush-muted">{s.badge}</span>
                    </div>
                  </div>
                  <Badge variant={s.accent === "green" ? "herbal" : s.accent === "saffron" ? "saffron" : "default"}>
                    Stakeholder Portal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2.5">
                  {s.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-ayush-dark">
                      <CheckCircle2 className="w-4 h-4 text-ayush-green shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/**
 * 3. THE PROBLEM SECTION
 * Real-world challenges addressed by PS 26044
 */
export function ProblemSection() {
  const problems = [
    {
      title: "Skill Gap & Lack of Visibility",
      detail:
        "Ayush curricula and emerging industry expectations often diverge, making it difficult for students to identify and address their specific skill gaps before graduation.",
      impact: "Uncertainty regarding industry readiness & unstandardized competency metrics",
    },
    {
      title: "Limited Industry Collaboration Channels",
      detail:
        "Ayush enterprises struggle to identify qualified talent for internships and projects, while academic institutions face hurdles establishing structured collaborative partnerships.",
      impact: "Untapped research potential & fragmented student placement pathways",
    },
    {
      title: "Dispersed Academic & Clinical Records",
      detail:
        "Student achievements, clinical competencies, and faculty research contributions are often documented on paper or fragmented systems without a unified digital portfolio.",
      impact: "Administrative overhead & difficulty presenting verified qualifications",
    },
  ];

  return (
    <section className="w-full space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <HeritageDivider label="The Need" />
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-ayush-dark">
          Bridging the Gap Between Ayush Academia & Industry
        </h2>
        <p className="text-sm text-ayush-muted leading-relaxed">
          Addressing systemic friction points in skill recognition, experiential learning, and inter-organizational collaboration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {problems.map((prob, idx) => (
          <Card key={idx} className="border-t-4 border-t-ayush-terracotta/70 bg-ayush-card flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="text-xs font-mono text-ayush-terracotta font-semibold uppercase tracking-wider mb-1">
                Challenge 0{idx + 1}
              </div>
              <CardTitle className="text-lg">{prob.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-ayush-muted leading-relaxed">
                {prob.detail}
              </p>
              <div className="rounded-lg bg-ayush-terracotta/10 border border-ayush-terracotta/20 p-2.5 text-[11px] text-ayush-terracotta font-medium">
                {prob.impact}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/**
 * 4. END-TO-END JOURNEY
 */
export function EndToEndJourneySection() {
  const stages = [
    {
      step: "Phase 1",
      title: "Skill Assessment & Onboarding",
      detail: "Scholars and educators establish digital profiles, assess proficiencies, and map competencies within the skills registry.",
      milestone: "Skill Baseline Established",
    },
    {
      step: "Phase 2",
      title: "Personalized Learning & Digital Portfolio",
      detail: "Following an adaptive roadmap, learners document clinical logs, case studies, and certifications in secure digital records.",
      milestone: "Portfolio Validation",
    },
    {
      step: "Phase 3",
      title: "Internships, Projects & Research",
      detail: "Participate in industry internships, apprenticeships, and faculty-led joint research projects.",
      milestone: "Hands-on Experience",
    },
    {
      step: "Phase 4",
      title: "Placement Opportunities & Collaboration",
      detail: "Leverage skill-based opportunity matching to transition into professional practice, research careers, and long-term industry partnerships.",
      milestone: "Professional Milestone",
    },
  ];

  return (
    <section className="w-full space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <HeritageDivider label="Continuous Journey" />
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-ayush-dark">
          The End-to-End Academic & Career Journey
        </h2>
        <p className="text-sm text-ayush-muted leading-relaxed">
          Guiding Ayush scholars from initial competency assessment through personalized learning, practical projects, and professional opportunity matching.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-ayush-border/80 bg-ayush-card p-6 shadow-warm flex flex-col justify-between relative group hover:border-ayush-border transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-semibold text-ayush-saffron uppercase">
                  {stage.step}
                </span>
                <span className="h-2 w-2 rounded-full bg-ayush-green" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-ayush-dark mb-2 leading-snug">
                {stage.title}
              </h3>
              <p className="text-xs text-ayush-muted leading-relaxed mb-4">
                {stage.detail}
              </p>
            </div>
            <div className="pt-3 border-t border-ayush-border/50 flex items-center justify-between text-[11px] font-medium text-ayush-brown">
              <span>{stage.milestone}</span>
              <ArrowRight className="w-3.5 h-3.5 text-ayush-saffron group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 6. FINAL CALL TO ACTION (CTA)
 */
export function FinalCtaSection() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-ayush-border bg-gradient-to-br from-ayush-card via-ayush-card to-ayush-sand/50 p-8 sm:p-14 shadow-warm-lg text-center space-y-6">
      {/* VEDA SETU Logo */}
      <div className="flex justify-center mb-1">
        <Image
          src="/images/veda-setu-logo.png"
          alt="Veda Setu"
          width={260}
          height={90}
          className="h-14 sm:h-16 w-auto object-contain mx-auto"
          priority
        />
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-ayush-dark tracking-tight">
          Join the Ayush Academia–Industry Collaboration Platform
        </h2>
        <p className="text-sm sm:text-base text-ayush-muted leading-relaxed">
          Connecting Ayush institutions, scholars, educators, and industry partners to advance skills, research, and career opportunities.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Button asChild size="lg" variant="default" className="gap-2">
          <Link href="/auth/sign-up">
            <span>Register as an Institution / Scholar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/login">
            <span>Sign In to Portal</span>
          </Link>
        </Button>
      </div>

      <div className="pt-6 border-t border-ayush-border/50 max-w-lg mx-auto flex items-center justify-center gap-4 text-xs text-ayush-muted">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-ayush-green" />
          Secure Digital Records
        </span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <HerbLeaf className="w-4 h-4 text-ayush-saffron" />
          Skill-Based Opportunity Matching
        </span>
      </div>
    </section>
  );
}
