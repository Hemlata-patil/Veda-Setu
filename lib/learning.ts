/**
 * Learning & Development + Personalized Roadmap Domain Logic
 * Pure calculations and platform-defined guidance mapping for student competency growth.
 */

import {
  CompetencyCategory,
  CATEGORY_CONFIG,
  StudentSkillProfileData,
  CompetencyProfileItem,
} from "./competencies";

export type RoadmapProgressStatus =
  | "Not Started"
  | "In Progress"
  | "Ready to Demonstrate";

export interface CompetencyActionPlan {
  competencyId: string;
  competencyName: string;
  category: CompetencyCategory;
  score: number;
  description: string | null;
  whyItMatters: string;
  recommendedNextAction: string;
  stage1Action: string;
  stage2Action: string;
  stage3Action: string;
  progressStatus: RoadmapProgressStatus;
}

export interface StrongAreaItem {
  competencyId: string;
  competencyName: string;
  score: number;
  category: CompetencyCategory;
  suggestedAction: string;
}

export interface CategoryRoadmapSummary {
  category: CompetencyCategory;
  label: string;
  shortLabel: string;
  averageScore: number;
  totalCompetencies: number;
  priorityAreasCount: number;
  badgeVariant: "herbal" | "saffron" | "parchment" | "default";
}

export interface PersonalizedRoadmapData {
  hasCompetencyData: boolean;
  priorityAreas: CompetencyActionPlan[];
  topStrengths: StrongAreaItem[];
  categorySummaries: CategoryRoadmapSummary[];
  currentOverallStage: "Stage 1: Strengthen Foundations" | "Stage 2: Practice & Apply" | "Stage 3: Demonstrate & Build Evidence" | "Pending Assessment";
  priorityCount: number;
}

/**
 * Returns specific platform-defined pedagogical guidance for a competency.
 * Important: These actions are platform-generated guidance, not official NCISM recommendations.
 */
export function getGuidanceForCompetency(name: string, category: CompetencyCategory) {
  const lower = name.toLowerCase();

  if (lower.includes("statistic")) {
    return {
      whyItMatters: "Essential for interpreting clinical trial results, evidence synthesis, and validating Ayurvedic clinical outcomes with objective metrics.",
      recommendedNextAction: "Review basic statistical concepts and practice reading study data summaries.",
      stage1Action: "Review basic statistical concepts and descriptive biostatistics.",
      stage2Action: "Practice interpreting simple research data, sample sizes, and p-values.",
      stage3Action: "Demonstrate understanding through a research/project activity or trial analysis.",
    };
  }

  if (lower.includes("research methodology")) {
    return {
      whyItMatters: "Forms the backbone for structured clinical trials, observational studies, and evidence-based Ayurvedic research.",
      recommendedNextAction: "Study standard clinical research design guidelines and protocol structuring.",
      stage1Action: "Review foundational principles of clinical research designs and sampling methods.",
      stage2Action: "Practice formulating research questions and structured study protocols.",
      stage3Action: "Demonstrate methodology skills by contributing to a study protocol or systematic literature review.",
    };
  }

  if (lower.includes("history") || lower.includes("examination")) {
    return {
      whyItMatters: "Critical for diagnostic precision, Rogi-Roga Pariksha, and identifying subtle clinical signs in clinical Ayurveda.",
      recommendedNextAction: "Practice structured patient history recording with standardized case proformas.",
      stage1Action: "Review systematic clinical examination steps, Asthavidha Pariksha, and vitals assessment.",
      stage2Action: "Practice structured history-taking and clinical documentation under simulated or supervised clinical sessions.",
      stage3Action: "Demonstrate clinical examination proficiency during ward rounds and clinical case presentations.",
    };
  }

  if (lower.includes("communication") || lower.includes("patient")) {
    return {
      whyItMatters: "Fosters therapeutic trust, patient compliance with Ahara-Vihara regimens, and empathetic healthcare delivery.",
      recommendedNextAction: "Engage in simulated patient consultations focusing on empathetic listening and clear regimen explanation.",
      stage1Action: "Review patient communication ethics, active listening techniques, and clinical counseling principles.",
      stage2Action: "Practice counseling patients on dietary modifications (Ahara) and lifestyle adjustments (Vihara).",
      stage3Action: "Demonstrate effective empathetic dialogue during live patient consultations and follow-up reviews.",
    };
  }

  // Category-based fallback templates
  switch (category) {
    case "academic_domain":
      return {
        whyItMatters: "Provides core classical theory and physiological principles necessary for sound Ayurvedic clinical reasoning.",
        recommendedNextAction: "Review classical Samhitas and cross-reference with modern anatomical and physiological principles.",
        stage1Action: "Review foundational classical concepts, Doshic balance, and physiological mechanisms.",
        stage2Action: "Practice correlating classical Ayurvedic terminology with clinical physiological manifestations.",
        stage3Action: "Demonstrate conceptual diagnostic clarity in academic discussions and case reviews.",
      };
    case "clinical_practical":
      return {
        whyItMatters: "Directly determines treatment efficacy, patient safety, and structured management of clinical conditions.",
        recommendedNextAction: "Participate in supervised clinical rounds and review standard treatment guidelines.",
        stage1Action: "Review clinical management protocols, pharmacotherapy (Dravyaguna), and safety contraindications.",
        stage2Action: "Practice clinical decision-making and therapeutic regimen planning for common conditions.",
        stage3Action: "Demonstrate clinical competence through case presentations and patient management documentation.",
      };
    case "research":
      return {
        whyItMatters: "Enables scientific validation of traditional formulations and integration into mainstream healthcare research.",
        recommendedNextAction: "Engage with Ayush research databases and practice critical appraisal of clinical trials.",
        stage1Action: "Review research fundamentals, ethical guidelines (GCP/ICMR), and evidence hierarchies.",
        stage2Action: "Practice evaluating published scientific literature and identifying study strengths/limitations.",
        stage3Action: "Demonstrate research competency by developing an evidence synthesis or research synopsis.",
      };
    case "professional":
    default:
      return {
        whyItMatters: "Ensures ethical practice, compliance with NCISM regulations, and constructive interdisciplinary teamwork.",
        recommendedNextAction: "Review professional healthcare ethics and multidisciplinary communication standards.",
        stage1Action: "Review professional codes of conduct, patient confidentiality, and regulatory responsibilities.",
        stage2Action: "Practice interprofessional communication scenarios and collaborative healthcare discussions.",
        stage3Action: "Demonstrate ethical patient interaction and seamless team collaboration during clinical postings.",
      };
  }
}

/**
 * Builds the personalized roadmap from the student's evaluated skill profile.
 */
export function buildPersonalizedRoadmap(
  profileData: StudentSkillProfileData
): PersonalizedRoadmapData {
  if (!profileData.hasCompletedAssessment || profileData.competencies.length === 0) {
    return {
      hasCompetencyData: false,
      priorityAreas: [],
      topStrengths: [],
      categorySummaries: [
        { category: "academic_domain", label: CATEGORY_CONFIG.academic_domain.label, shortLabel: CATEGORY_CONFIG.academic_domain.shortLabel, averageScore: 0, totalCompetencies: 0, priorityAreasCount: 0, badgeVariant: "herbal" },
        { category: "clinical_practical", label: CATEGORY_CONFIG.clinical_practical.label, shortLabel: CATEGORY_CONFIG.clinical_practical.shortLabel, averageScore: 0, totalCompetencies: 0, priorityAreasCount: 0, badgeVariant: "saffron" },
        { category: "research", label: CATEGORY_CONFIG.research.label, shortLabel: CATEGORY_CONFIG.research.shortLabel, averageScore: 0, totalCompetencies: 0, priorityAreasCount: 0, badgeVariant: "parchment" },
        { category: "professional", label: CATEGORY_CONFIG.professional.label, shortLabel: CATEGORY_CONFIG.professional.shortLabel, averageScore: 0, totalCompetencies: 0, priorityAreasCount: 0, badgeVariant: "default" },
      ],
      currentOverallStage: "Pending Assessment",
      priorityCount: 0,
    };
  }

  // 1. Identify Priority Areas (score < 60, sorted lowest to highest)
  const lowScoringComps = profileData.competencies
    .filter((c) => c.score < 60)
    .sort((a, b) => a.score - b.score);

  const top3Priority = lowScoringComps.slice(0, 3).map((c) => {
    const guidance = getGuidanceForCompetency(c.name, c.category);
    // Initial UI status: if score < 45 -> Not Started; if 45 <= score < 60 -> In Progress
    const progressStatus: RoadmapProgressStatus =
      c.score < 45 ? "Not Started" : "In Progress";

    return {
      competencyId: c.id,
      competencyName: c.name,
      category: c.category,
      score: c.score,
      description: c.description,
      whyItMatters: guidance.whyItMatters,
      recommendedNextAction: guidance.recommendedNextAction,
      stage1Action: guidance.stage1Action,
      stage2Action: guidance.stage2Action,
      stage3Action: guidance.stage3Action,
      progressStatus,
    };
  });

  // 2. Identify Strong Areas (top 3 highest scores)
  const highScoringComps = [...profileData.competencies]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => ({
      competencyId: c.id,
      competencyName: c.name,
      score: c.score,
      category: c.category,
      suggestedAction:
        "Continue applying this competency through projects, internships, clinical learning, or research activities.",
    }));

  // 3. Category Summaries (real data)
  const categories: CompetencyCategory[] = [
    "academic_domain",
    "clinical_practical",
    "research",
    "professional",
  ];

  const categorySummaries: CategoryRoadmapSummary[] = categories.map((cat) => {
    const catItems = profileData.competencies.filter((c) => c.category === cat);
    const count = catItems.length;
    const avg =
      count > 0
        ? Math.round(catItems.reduce((acc, curr) => acc + curr.score, 0) / count)
        : 0;
    const priorityCount = catItems.filter((c) => c.score < 60).length;

    return {
      category: cat,
      label: CATEGORY_CONFIG[cat].label,
      shortLabel: CATEGORY_CONFIG[cat].shortLabel,
      averageScore: avg,
      totalCompetencies: count,
      priorityAreasCount: priorityCount,
      badgeVariant: CATEGORY_CONFIG[cat].badgeVariant,
    };
  });

  // 4. Overall Stage determination based on lowest competency score
  let currentOverallStage: PersonalizedRoadmapData["currentOverallStage"] =
    "Stage 3: Demonstrate & Build Evidence";

  if (lowScoringComps.length > 0) {
    const lowest = lowScoringComps[0].score;
    if (lowest < 45) {
      currentOverallStage = "Stage 1: Strengthen Foundations";
    } else {
      currentOverallStage = "Stage 2: Practice & Apply";
    }
  }

  return {
    hasCompetencyData: true,
    priorityAreas: top3Priority,
    topStrengths: highScoringComps,
    categorySummaries,
    currentOverallStage,
    priorityCount: lowScoringComps.length,
  };
}
