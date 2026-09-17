"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PortfolioModal,
  PortfolioItemRecord,
} from "./portfolio-modal";
import { deletePortfolioItem } from "./actions";
import {
  PortfolioItemType,
  PortfolioDocumentRecord,
} from "./types";
import { PortfolioDocumentAttachment } from "./portfolio-document-attachment";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Scroll,
  Sparkles,
  Trash2,
  User,
  Briefcase,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string | null;
  program?: string | null;
  year?: number | null;
  department?: string | null;
  institution_name?: string | null;
}

interface CompetencyData {
  id: string;
  name: string;
  category: "academic_domain" | "clinical_practical" | "research" | "professional";
  score: number;
  verified: boolean;
}

interface PlacementData {
  id: string;
  opportunityTitle: string;
  organizationName?: string | null;
  engagementType: string;
  status: string;
  startDate?: string | null;
  completionDate?: string | null;
  outcome?: string | null;
}

interface CollaborationData {
  id: string;
  title: string;
  type: string;
  organizationName?: string | null;
  status: string;
}

interface PortfolioViewProps {
  profile: ProfileData;
  competencies: CompetencyData[];
  portfolioItems: PortfolioItemRecord[];
  documents?: PortfolioDocumentRecord[];
  placements: PlacementData[];
  collaborations: CollaborationData[];
}

export function PortfolioView({
  profile,
  competencies,
  portfolioItems,
  documents = [],
  placements,
  collaborations,
}: PortfolioViewProps) {
  const router = useRouter();

  // Document lookup map
  const documentsByItemId = React.useMemo(() => {
    const map = new Map<string, PortfolioDocumentRecord>();
    (documents || []).forEach((d) => map.set(d.portfolio_item_id, d));
    return map;
  }, [documents]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalDefaultType, setModalDefaultType] = React.useState<PortfolioItemType>("certification");
  const [editingItem, setEditingItem] = React.useState<PortfolioItemRecord | null>(null);

  // Deleting item state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleOpenAdd = (type: PortfolioItemType) => {
    setEditingItem(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PortfolioItemRecord) => {
    setEditingItem(item);
    setModalDefaultType(item.item_type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this item from your portfolio?")) {
      return;
    }
    setDeletingId(id);
    const res = await deletePortfolioItem(id);
    setDeletingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to delete portfolio item.");
    }
  };

  // Group portfolio items by category
  const certifications = portfolioItems.filter((i) => i.item_type === "certification");
  const projects = portfolioItems.filter((i) => i.item_type === "project");
  const researchPubs = portfolioItems.filter(
    (i) => i.item_type === "research" || i.item_type === "publication"
  );
  const achievementsWorkshops = portfolioItems.filter(
    (i) =>
      i.item_type === "achievement" ||
      i.item_type === "workshop" ||
      i.item_type === "other"
  );

  // Group competencies
  const groupedSkills = {
    academic_domain: competencies.filter((c) => c.category === "academic_domain"),
    clinical_practical: competencies.filter((c) => c.category === "clinical_practical"),
    research: competencies.filter((c) => c.category === "research"),
    professional: competencies.filter((c) => c.category === "professional"),
  };

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. PROFILE SUMMARY SECTION */}
      <section id="profile-summary">
        <Card accent="green" className="border-ayush-border/80 shadow-sm bg-gradient-to-br from-ayush-card via-ayush-card to-ayush-sand/30">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-ayush-sand border border-ayush-border flex items-center justify-center font-heading text-2xl font-bold text-ayush-brown shrink-0 shadow-sm">
                  {(profile.full_name || "AS").slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-ayush-dark">
                      {profile.full_name || "Ayush Scholar"}
                    </h2>
                    <Badge variant="herbal" className="text-xs">
                      Verified Scholar
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ayush-muted">
                    {profile.program && (
                      <span className="font-medium text-ayush-dark">
                        {profile.program}
                      </span>
                    )}
                    {profile.year && (
                      <span>• Year {profile.year}</span>
                    )}
                    {profile.department && (
                      <span>• Dept: {profile.department}</span>
                    )}
                    {profile.institution_name && (
                      <span className="flex items-center gap-1 text-ayush-teal font-medium">
                        <Building2 className="w-3.5 h-3.5" />
                        {profile.institution_name}
                      </span>
                    )}
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-ayush-muted">
                    <span>{profile.email}</span>
                    {profile.phone && <span>• {profile.phone}</span>}
                  </div>
                </div>
              </div>

              {/* High-level portfolio counts */}
              <div className="flex flex-wrap items-center gap-3 md:self-center border-t md:border-t-0 md:border-l border-ayush-border/60 pt-4 md:pt-0 md:pl-6">
                <div className="text-center px-3 py-1.5 rounded-xl bg-ayush-sand/50">
                  <span className="text-[10px] uppercase font-semibold text-ayush-muted block">Items</span>
                  <span className="font-heading text-xl font-bold text-ayush-dark">{portfolioItems.length}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-xl bg-ayush-sand/50">
                  <span className="text-[10px] uppercase font-semibold text-ayush-muted block">Competencies</span>
                  <span className="font-heading text-xl font-bold text-ayush-green">{competencies.length}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-xl bg-ayush-sand/50">
                  <span className="text-[10px] uppercase font-semibold text-ayush-muted block">Placements</span>
                  <span className="font-heading text-xl font-bold text-ayush-saffron">{placements.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. SKILLS (COMPETENCIES) SECTION */}
      <section id="skills" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-ayush-green" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Standardized Competencies & Skills
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Source: Standardized Ayush Assessment Registry. Read-only verified academic and clinical skills.
            </p>
          </div>
          <Badge variant="parchment" className="self-start sm:self-auto text-xs">
            {competencies.length} Verified Competencies
          </Badge>
        </div>

        {competencies.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm">
            No competency records found. Complete the standardized skill assessment to populate your competency profile.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category: Academic / Domain */}
            <Card className="p-5 border-ayush-border/80">
              <div className="flex items-center justify-between mb-3 border-b border-ayush-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-ayush-green" />
                  <h4 className="font-medium text-sm text-ayush-dark">Academic & Domain</h4>
                </div>
                <Badge variant="herbal" className="text-[10px]">
                  {groupedSkills.academic_domain.length} Skills
                </Badge>
              </div>
              <div className="space-y-3">
                {groupedSkills.academic_domain.length === 0 ? (
                  <p className="text-xs text-ayush-muted italic">No domain competencies recorded.</p>
                ) : (
                  groupedSkills.academic_domain.map((sk) => (
                    <div key={sk.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                          {sk.name}
                          {sk.verified && (
                            <span title="Verified" className="inline-flex">
                              <CheckCircle2 className="w-3 h-3 text-ayush-green" />
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-ayush-dark">{sk.score}%</span>
                      </div>
                      <Progress value={sk.score} max={100} variant="green" size="sm" />
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Category: Clinical / Practical */}
            <Card className="p-5 border-ayush-border/80">
              <div className="flex items-center justify-between mb-3 border-b border-ayush-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-ayush-saffron" />
                  <h4 className="font-medium text-sm text-ayush-dark">Clinical & Practical</h4>
                </div>
                <Badge variant="saffron" className="text-[10px]">
                  {groupedSkills.clinical_practical.length} Skills
                </Badge>
              </div>
              <div className="space-y-3">
                {groupedSkills.clinical_practical.length === 0 ? (
                  <p className="text-xs text-ayush-muted italic">No clinical competencies recorded.</p>
                ) : (
                  groupedSkills.clinical_practical.map((sk) => (
                    <div key={sk.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                          {sk.name}
                          {sk.verified && (
                            <span title="Verified" className="inline-flex">
                              <CheckCircle2 className="w-3 h-3 text-ayush-green" />
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-ayush-dark">{sk.score}%</span>
                      </div>
                      <Progress value={sk.score} max={100} variant="saffron" size="sm" />
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Category: Research */}
            <Card className="p-5 border-ayush-border/80">
              <div className="flex items-center justify-between mb-3 border-b border-ayush-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-ayush-brown" />
                  <h4 className="font-medium text-sm text-ayush-dark">Research & Evidence</h4>
                </div>
                <Badge variant="parchment" className="text-[10px]">
                  {groupedSkills.research.length} Skills
                </Badge>
              </div>
              <div className="space-y-3">
                {groupedSkills.research.length === 0 ? (
                  <p className="text-xs text-ayush-muted italic">No research competencies recorded.</p>
                ) : (
                  groupedSkills.research.map((sk) => (
                    <div key={sk.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                          {sk.name}
                          {sk.verified && (
                            <span title="Verified" className="inline-flex">
                              <CheckCircle2 className="w-3 h-3 text-ayush-green" />
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-ayush-dark">{sk.score}%</span>
                      </div>
                      <Progress value={sk.score} max={100} variant="brown" size="sm" />
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Category: Professional */}
            <Card className="p-5 border-ayush-border/80">
              <div className="flex items-center justify-between mb-3 border-b border-ayush-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-ayush-green" />
                  <h4 className="font-medium text-sm text-ayush-dark">Professional Practice</h4>
                </div>
                <Badge variant="herbal" className="text-[10px]">
                  {groupedSkills.professional.length} Skills
                </Badge>
              </div>
              <div className="space-y-3">
                {groupedSkills.professional.length === 0 ? (
                  <p className="text-xs text-ayush-muted italic">No professional competencies recorded.</p>
                ) : (
                  groupedSkills.professional.map((sk) => (
                    <div key={sk.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ayush-dark flex items-center gap-1.5">
                          {sk.name}
                          {sk.verified && (
                            <span title="Verified" className="inline-flex">
                              <CheckCircle2 className="w-3 h-3 text-ayush-green" />
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-ayush-dark">{sk.score}%</span>
                      </div>
                      <Progress value={sk.score} max={100} variant="green" size="sm" />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* 3. CERTIFICATIONS SECTION */}
      <section id="certifications" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-ayush-green" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Certifications & Accreditations
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Official courses, standardized exams, and clinical skill accreditations.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenAdd("certification")}
            className="bg-ayush-green hover:bg-ayush-green/90 text-white gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </Button>
        </div>

        {certifications.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm bg-ayush-sand/10 border-dashed">
            No certifications added yet. Click &quot;Add Certification&quot; to showcase your accreditations.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((item) => (
              <Card key={item.id} className="p-5 border-ayush-border/80 hover:shadow-warm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <Badge variant="herbal" className="text-[10px] mb-1">
                      Certification
                    </Badge>
                    <h4 className="font-heading text-base font-bold text-ayush-dark leading-snug">
                      {item.title}
                    </h4>
                    {item.issuer_or_organization && (
                      <p className="text-xs text-ayush-teal font-medium">
                        {item.issuer_or_organization}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-ayush-dark hover:bg-ayush-sand/50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-ayush-muted leading-relaxed mt-2.5">
                    {item.description}
                  </p>
                )}

                {item.achievement && (
                  <div className="mt-3 p-2 rounded-lg bg-ayush-sand/40 border border-ayush-border/40 text-xs text-ayush-dark">
                    <span className="font-semibold text-ayush-brown">Cred / Distinction:</span>{" "}
                    {item.achievement}
                  </div>
                )}

                {/* Document Evidence Attachment */}
                <PortfolioDocumentAttachment
                  portfolioItemId={item.id}
                  document={documentsByItemId.get(item.id)}
                  onDocumentChange={() => router.refresh()}
                />

                <div className="mt-4 pt-3 border-t border-ayush-border/40 flex items-center justify-between text-[11px] text-ayush-muted">
                  <span>
                    {item.end_date ? `Completed: ${formatDate(item.end_date)}` : "Ongoing"}
                  </span>
                  {item.reference_url && (
                    <a
                      href={item.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ayush-green font-medium hover:underline"
                    >
                      <span>View Credential</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4. PROJECTS SECTION */}
      <section id="projects" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-ayush-saffron" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Projects & Initiatives
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Academic case studies, botanical research projects, or clinical formulation initiatives.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenAdd("project")}
            className="bg-ayush-saffron hover:bg-ayush-saffron/90 text-white gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm bg-ayush-sand/10 border-dashed">
            No projects added yet. Click &quot;Add Project&quot; to showcase your practical casework or research projects.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((item) => (
              <Card key={item.id} className="p-5 border-ayush-border/80 hover:shadow-warm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <Badge variant="saffron" className="text-[10px] mb-1">
                      Project
                    </Badge>
                    <h4 className="font-heading text-base font-bold text-ayush-dark leading-snug">
                      {item.title}
                    </h4>
                    {item.issuer_or_organization && (
                      <p className="text-xs text-ayush-teal font-medium">
                        {item.issuer_or_organization}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-ayush-dark hover:bg-ayush-sand/50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-ayush-muted leading-relaxed mt-2.5">
                    {item.description}
                  </p>
                )}

                {item.achievement && (
                  <div className="mt-3 p-2 rounded-lg bg-ayush-sand/40 border border-ayush-border/40 text-xs text-ayush-dark">
                    <span className="font-semibold text-ayush-brown">Key Outcome:</span>{" "}
                    {item.achievement}
                  </div>
                )}

                {/* Document Evidence Attachment */}
                <PortfolioDocumentAttachment
                  portfolioItemId={item.id}
                  document={documentsByItemId.get(item.id)}
                  onDocumentChange={() => router.refresh()}
                />

                <div className="mt-4 pt-3 border-t border-ayush-border/40 flex items-center justify-between text-[11px] text-ayush-muted">
                  <span>
                    {item.start_date ? formatDate(item.start_date) : ""}
                    {item.start_date && item.end_date ? " – " : ""}
                    {item.end_date ? formatDate(item.end_date) : (!item.start_date ? "Completed" : "Present")}
                  </span>
                  {item.reference_url && (
                    <a
                      href={item.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ayush-saffron font-medium hover:underline"
                    >
                      <span>Project Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 5. RESEARCH & PUBLICATIONS SECTION */}
      <section id="research-publications" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-ayush-brown" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Research & Publications
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Peer-reviewed articles, conference proceedings, or systematic clinical trials.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenAdd("publication")}
            className="bg-ayush-brown hover:bg-ayush-brown/90 text-white gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Research / Publication</span>
          </Button>
        </div>

        {researchPubs.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm bg-ayush-sand/10 border-dashed">
            No research papers or publications recorded yet. Click &quot;Add Research / Publication&quot; to add your scientific work.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {researchPubs.map((item) => (
              <Card key={item.id} className="p-5 border-ayush-border/80 hover:shadow-warm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <Badge variant={item.item_type === "research" ? "saffron" : "parchment"} className="text-[10px] capitalize mb-1">
                      {item.item_type}
                    </Badge>
                    <h4 className="font-heading text-base font-bold text-ayush-dark leading-snug">
                      {item.title}
                    </h4>
                    {item.issuer_or_organization && (
                      <p className="text-xs text-ayush-teal font-medium">
                        {item.issuer_or_organization}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-ayush-dark hover:bg-ayush-sand/50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-ayush-muted leading-relaxed mt-2.5">
                    {item.description}
                  </p>
                )}

                {item.achievement && (
                  <div className="mt-3 p-2 rounded-lg bg-ayush-sand/40 border border-ayush-border/40 text-xs text-ayush-dark">
                    <span className="font-semibold text-ayush-brown">DOI / Citation:</span>{" "}
                    {item.achievement}
                  </div>
                )}

                {/* Document Evidence Attachment */}
                <PortfolioDocumentAttachment
                  portfolioItemId={item.id}
                  document={documentsByItemId.get(item.id)}
                  onDocumentChange={() => router.refresh()}
                />

                <div className="mt-4 pt-3 border-t border-ayush-border/40 flex items-center justify-between text-[11px] text-ayush-muted">
                  <span>
                    {item.end_date ? `Published: ${formatDate(item.end_date)}` : (item.start_date ? formatDate(item.start_date) : "")}
                  </span>
                  {item.reference_url && (
                    <a
                      href={item.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ayush-brown font-medium hover:underline"
                    >
                      <span>Read Paper</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 6. ACHIEVEMENTS & WORKSHOPS SECTION */}
      <section id="achievements-workshops" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ayush-saffron" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Achievements & Workshops
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Awards, hackathon honors, CME workshops, and continuous professional education.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenAdd("workshop")}
            className="gap-1.5 self-start sm:self-auto text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Achievement / Workshop</span>
          </Button>
        </div>

        {achievementsWorkshops.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm bg-ayush-sand/10 border-dashed">
            No achievements or workshop records added yet. Click &quot;Add Achievement / Workshop&quot; to include them.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievementsWorkshops.map((item) => (
              <Card key={item.id} className="p-5 border-ayush-border/80 hover:shadow-warm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <Badge variant="parchment" className="text-[10px] capitalize mb-1">
                      {item.item_type}
                    </Badge>
                    <h4 className="font-heading text-base font-bold text-ayush-dark leading-snug">
                      {item.title}
                    </h4>
                    {item.issuer_or_organization && (
                      <p className="text-xs text-ayush-teal font-medium">
                        {item.issuer_or_organization}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-ayush-dark hover:bg-ayush-sand/50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-ayush-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-ayush-muted leading-relaxed mt-2.5">
                    {item.description}
                  </p>
                )}

                {item.achievement && (
                  <div className="mt-3 p-2 rounded-lg bg-ayush-sand/40 border border-ayush-border/40 text-xs text-ayush-dark">
                    <span className="font-semibold text-ayush-brown">Award / Outcome:</span>{" "}
                    {item.achievement}
                  </div>
                )}

                {/* Document Evidence Attachment */}
                <PortfolioDocumentAttachment
                  portfolioItemId={item.id}
                  document={documentsByItemId.get(item.id)}
                  onDocumentChange={() => router.refresh()}
                />

                <div className="mt-4 pt-3 border-t border-ayush-border/40 flex items-center justify-between text-[11px] text-ayush-muted">
                  <span>
                    {item.end_date ? formatDate(item.end_date) : (item.start_date ? formatDate(item.start_date) : "Recorded")}
                  </span>
                  {item.reference_url && (
                    <a
                      href={item.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ayush-green font-medium hover:underline"
                    >
                      <span>Event Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 7. INTERNSHIP & PLACEMENT SECTION (READ-ONLY) */}
      <section id="internship-placement" className="space-y-4">
        <div className="flex items-center justify-between border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-ayush-green" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Internship & Placement Records
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Verified clinical and industry placements tracked in the Ayush Placement Registry. Read-only.
            </p>
          </div>
          <Badge variant="herbal" className="text-[10px]">
            Official Placement
          </Badge>
        </div>

        {placements.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm bg-ayush-sand/10 border-dashed">
            No internship or placement record yet.
          </Card>
        ) : (
          <div className="space-y-4">
            {placements.map((plc) => (
              <Card key={plc.id} className="p-5 border-ayush-border/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading text-base font-bold text-ayush-dark">
                        {plc.opportunityTitle}
                      </h4>
                      <Badge variant="saffron" className="text-[10px] capitalize">
                        {plc.engagementType.replace("_", " ")}
                      </Badge>
                      <Badge variant="herbal" className="text-[10px] capitalize">
                        Status: {plc.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {plc.organizationName && (
                      <p className="text-xs text-ayush-teal font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {plc.organizationName}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-ayush-muted text-right shrink-0 space-y-0.5">
                    {plc.startDate && (
                      <div>
                        <span>Started: {formatDate(plc.startDate)}</span>
                      </div>
                    )}
                    {plc.completionDate && (
                      <div>
                        <span>Completed: {formatDate(plc.completionDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {plc.outcome && (
                  <div className="mt-3 p-2.5 rounded-lg bg-ayush-sand/30 border border-ayush-border/40 text-xs text-ayush-dark">
                    <span className="font-semibold text-ayush-brown">Placement Outcome:</span>{" "}
                    {plc.outcome}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 8. INDUSTRY / FACULTY COLLABORATION SECTION (READ-ONLY) */}
      <section id="collaboration" className="space-y-4">
        <div className="flex items-center justify-between border-b border-ayush-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Scroll className="w-5 h-5 text-ayush-brown" />
              <h3 className="font-heading text-xl font-bold text-ayush-dark">
                Industry & Faculty Collaboration
              </h3>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Verified accepted collaborations, industry projects, or faculty research initiatives. Read-only.
            </p>
          </div>
          <Badge variant="parchment" className="text-[10px]">
            Collaborations
          </Badge>
        </div>

        {collaborations.length === 0 ? (
          <Card className="p-6 text-center text-ayush-muted text-sm bg-ayush-sand/10 border-dashed">
            No collaboration activity recorded yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collaborations.map((collab) => (
              <Card key={collab.id} className="p-5 border-ayush-border/80">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="saffron" className="text-[10px] capitalize">
                      {collab.type === "fdp"
                        ? "FDP"
                        : collab.type === "research_project"
                        ? "Research Project"
                        : collab.type === "industry_collaboration"
                        ? "Industry Collaboration"
                        : collab.type.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={collab.status === "accepted" ? "herbal" : "saffron"}
                      className="text-[10px]"
                    >
                      {collab.status === "accepted"
                        ? "Accepted Participation"
                        : collab.status === "under_review"
                        ? "Under Review (Pending)"
                        : collab.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <h4 className="font-heading text-base font-bold text-ayush-dark">
                    {collab.title}
                  </h4>
                  {collab.organizationName && (
                    <p className="text-xs text-ayush-teal font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {collab.organizationName}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Reusable Item Modal */}
      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalDefaultType}
        itemToEdit={editingItem}
        existingDocument={editingItem ? documentsByItemId.get(editingItem.id) : null}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
