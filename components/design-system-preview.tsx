"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ChartCard } from "@/components/ui/chart-card";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { LotusEmblem, HerbLeaf, MortarPestle, HeritageDivider } from "@/components/ui/motifs";
import {
  Sparkles,
  Layers,
  Palette,
  Type,
  Sliders,
  CheckCircle2,
  FolderKanban,
  FileCheck,
} from "lucide-react";

export function DesignSystemPreview() {
  const [activeTab, setActiveTab] = React.useState("components");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const sampleTimeline: TimelineItem[] = [
    {
      id: 1,
      title: "Ayurvedic Pharmacognosy Milestone Completed",
      description: "Identification of active withanolides in Withania somnifera verified by academic mentor.",
      date: "Today, 10:30 AM",
      status: "completed",
      badge: "Clinical Log Verified",
    },
    {
      id: 2,
      title: "Industry Internship Application in Review",
      description: "Submitted to Dabur Research & Development Center for Clinical Formulations.",
      date: "Yesterday",
      status: "current",
      badge: "Under Faculty Review",
    },
    {
      id: 3,
      title: "NABH Clinical Quality Compliance Module",
      description: "Scheduled for semester 6 accreditation assessment.",
      date: "Upcoming Nov 2026",
      status: "pending",
    },
  ];

  return (
    <section id="design-system" className="w-full space-y-12 pt-8 pb-16">
      {/* Section Header */}
      <PageHeader
        eyebrow="Ayush Design Foundation"
        eyebrowColor="saffron"
        title="Global UI Design System & Component Library"
        description="Ayurvedic Heritage × Modern Digital: Calm parchment backgrounds, herbal green and saffron highlights, dignified Cormorant Garamond typography, and responsive SaaS components."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-ayush-saffron" />
              <span>Preview Dialog</span>
            </Button>
            <Badge variant="herbal" dot>
              System Ready
            </Badge>
          </div>
        }
      />

      {/* Interactive Tabs for Design System Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="pill">
        <TabsList className="mb-8 flex-wrap">
          <TabsTrigger value="components" icon={Layers}>
            Core Components
          </TabsTrigger>
          <TabsTrigger value="colors" icon={Palette}>
            Color System & Palette
          </TabsTrigger>
          <TabsTrigger value="data-ui" icon={FolderKanban}>
            Tables, Timelines & Charts
          </TabsTrigger>
          <TabsTrigger value="feedback" icon={Sliders}>
            States & Feedback
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Core Components */}
        <TabsContent value="components" className="space-y-8">
          {/* Buttons & Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card accent="saffron">
              <CardHeader>
                <CardTitle>Button System</CardTitle>
                <CardDescription>
                  Curated button variants with smooth micro-interactions, warm shadows, and Ayush heritage styling.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Primary Brown</Button>
                  <Button variant="secondary">Herbal Green</Button>
                  <Button variant="saffron">Saffron Accent</Button>
                  <Button variant="heritage">Heritage Framed</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive" size="sm">
                    Terracotta
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card accent="green">
              <CardHeader>
                <CardTitle>Badges & Statuses</CardTitle>
                <CardDescription>
                  Semantically tailored status indicators for clinical verification, accreditation, and review states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="herbal" dot>
                    Verified / Active
                  </Badge>
                  <Badge variant="saffron" dot>
                    Pending Review
                  </Badge>
                  <Badge variant="default">Institutional</Badge>
                  <Badge variant="parchment">Neutral Tag</Badge>
                  <Badge variant="outline">Border Tag</Badge>
                  <Badge variant="destructive" dot>
                    Attention Required
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Inputs & Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs & Form Controls</CardTitle>
              <CardDescription>
                Clean inputs on warm-white surfaces with `#D8C9B5` borders and herbal green focus rings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="inst-name">Institution Name</Label>
                  <Input
                    id="inst-name"
                    placeholder="e.g. All India Institute of Ayurveda"
                    defaultValue="National Institute of Ayurveda, Jaipur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ayush-skill">Ayush Skill Specialization</Label>
                  <Input
                    id="ayush-skill"
                    placeholder="e.g. Dravyaguna Formulation"
                    defaultValue="Panchakarma Clinical Protocol"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Clinical Research Brief</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter brief description..."
                    defaultValue="Standardized herbal extracts testing in accordance with Pharmacopoeia Commission for Indian Medicine."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Color System */}
        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { name: "Parchment", hex: "#F5EFE3", desc: "Global Background", bg: "bg-ayush-parchment", text: "text-ayush-dark", border: true },
              { name: "Warm White", hex: "#FFFDF8", desc: "Cards & Surfaces", bg: "bg-ayush-card", text: "text-ayush-dark", border: true },
              { name: "Deep Brown", hex: "#5A3A2E", desc: "Primary Action", bg: "bg-ayush-brown", text: "text-white" },
              { name: "Herbal Green", hex: "#596B45", desc: "Secondary / Verified", bg: "bg-ayush-green", text: "text-white" },
              { name: "Saffron Accent", hex: "#B98232", desc: "Key Highlights", bg: "bg-ayush-saffron", text: "text-white" },
              { name: "Dark Text", hex: "#2E261F", desc: "Headings & Body", bg: "bg-ayush-dark", text: "text-white" },
              { name: "Muted Text", hex: "#756A5F", desc: "Labels & Captions", bg: "bg-ayush-muted", text: "text-white" },
              { name: "Border", hex: "#D8C9B5", desc: "Dividers & Frames", bg: "bg-ayush-border", text: "text-ayush-dark" },
            ].map((col, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-ayush-border/80 bg-ayush-card p-3 shadow-warm flex flex-col justify-between"
              >
                <div className={`h-16 w-full rounded-lg ${col.bg} ${col.border ? "border border-ayush-border" : ""} mb-3 shadow-inner`} />
                <div>
                  <div className="text-xs font-semibold text-ayush-dark truncate">{col.name}</div>
                  <div className="font-mono text-[10px] text-ayush-muted">{col.hex}</div>
                  <div className="text-[10px] text-ayush-muted/80 mt-1 truncate">{col.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Typography System Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Typography System</CardTitle>
              <CardDescription>
                Cormorant Garamond for regal headings paired with Inter for legible, modern UI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 divide-y divide-ayush-border/50">
              <div className="pt-2">
                <span className="text-[11px] uppercase tracking-wider text-ayush-muted font-mono">Display Title (Cormorant Garamond)</span>
                <h1 className="font-heading text-3xl sm:text-4xl text-ayush-dark font-normal">
                  चरक संहिता · Evidence-Based Ayurvedic Science
                </h1>
              </div>
              <div className="pt-3">
                <span className="text-[11px] uppercase tracking-wider text-ayush-muted font-mono">Section Heading (Cormorant Garamond 600)</span>
                <h2 className="font-heading text-2xl text-ayush-dark font-semibold">
                  Standardized Clinical Skill Matrices & Industry Placements
                </h2>
              </div>
              <div className="pt-3">
                <span className="text-[11px] uppercase tracking-wider text-ayush-muted font-mono">Body & Data Typography (Inter)</span>
                <p className="text-sm text-ayush-dark leading-relaxed">
                  Inter delivers high-readability numerical metrics, tables, verification badges, and form controls across all desktop and mobile viewports.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tables, Timelines & Charts */}
        <TabsContent value="data-ui" className="space-y-8">
          {/* Table Component */}
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-semibold text-ayush-dark">
              Standardized Table Layout
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Accreditation Code</TableHead>
                  <TableHead>Active Cohort</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-ayush-dark">
                    National Institute of Ayurveda
                  </TableCell>
                  <TableCell className="text-ayush-muted">Jaipur, Rajasthan</TableCell>
                  <TableCell className="font-mono text-xs text-ayush-brown">AYU-JP-001</TableCell>
                  <TableCell>240 Scholars</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="herbal" dot>
                      Accredited
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-ayush-dark">
                    All India Institute of Ayurveda
                  </TableCell>
                  <TableCell className="text-ayush-muted">New Delhi</TableCell>
                  <TableCell className="font-mono text-xs text-ayush-brown">AYU-ND-002</TableCell>
                  <TableCell>185 Scholars</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="herbal" dot>
                      Accredited
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-ayush-dark">
                    Gujarat Ayurved University
                  </TableCell>
                  <TableCell className="text-ayush-muted">Jamnagar, Gujarat</TableCell>
                  <TableCell className="font-mono text-xs text-ayush-brown">AYU-JM-003</TableCell>
                  <TableCell>310 Scholars</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="saffron" dot>
                      Renewal Due
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Timeline & Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Milestone Timeline</CardTitle>
                <CardDescription>
                  Tracking student clinical cases, research deliverables, and internship cycles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline items={sampleTimeline} />
              </CardContent>
            </Card>

            <ChartCard
              title="Industry Collaboration Trajectory"
              subtitle="Quarterly active internship agreements and research MOUs"
              metric="48 Enterprises"
              metricLabel="Active Collaborations"
              trend={{ value: "+24% Growth", positive: true }}
            >
              <div className="w-full flex flex-col items-center justify-center py-6 text-center">
                <Progress value={78} label="Annual MOU Target (78% Achieved)" showLabel variant="green" className="max-w-xs mb-4" />
                <div className="flex items-center gap-6 text-xs text-ayush-muted mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ayush-green" /> Ayurvedic Pharma (60%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ayush-saffron" /> Wellness Clinical (40%)
                  </span>
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* Tab 4: Feedback & States */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Empty State */}
            <EmptyState
              icon={HerbLeaf}
              title="No Pending Applications"
              description="All internship applications for the current academic session have been reviewed."
              action={
                <Button variant="outline" size="sm">
                  View Archives
                </Button>
              }
            />

            {/* Error State */}
            <ErrorState
              title="Verification Incomplete"
              message="The institutional server is undergoing scheduled maintenance. Please retry in a moment."
              onRetry={() => alert("Retrying connection...")}
            />

            {/* Loading Skeleton */}
            <CardSkeleton />
          </div>
        </TabsContent>
      </Tabs>

      {/* Interactive Modal Dialog Demonstration */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Institution Partnership Verification"
        description="Verify collaborative academic credentials and clinical trial compliance."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsModalOpen(false)}>
              Confirm Verification
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-ayush-muted leading-relaxed">
            This modal utilizes the warm white card surface, subtle top heritage accent border, and Cormorant Garamond title styling.
          </p>
          <div className="rounded-xl border border-ayush-border/70 bg-ayush-sand/40 p-3 space-y-1 text-xs">
            <div className="font-semibold text-ayush-dark">Compliance Checklist:</div>
            <div className="flex items-center gap-2 text-ayush-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>National Commission for Indian System of Medicine (NCISM) verified</span>
            </div>
            <div className="flex items-center gap-2 text-ayush-green">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>MoU draft uploaded with digital signoff</span>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}
