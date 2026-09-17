/**
 * Competency Profile Domain Types & Pure Calculations
 * Designed for immediate Skill Profile rendering and future compatibility
 * with opportunity skill-matching and learning roadmap generation.
 */

export type CompetencyCategory =
  | "academic_domain"
  | "clinical_practical"
  | "research"
  | "professional";

export interface CategoryMetadata {
  key: CompetencyCategory;
  label: string;
  shortLabel: string;
  description: string;
  badgeVariant: "herbal" | "saffron" | "parchment" | "default";
}

export const CATEGORY_CONFIG: Record<CompetencyCategory, CategoryMetadata> = {
  academic_domain: {
    key: "academic_domain",
    label: "Academic & Domain Foundations",
    shortLabel: "Academic / Domain",
    description: "Foundational Ayurvedic principles, Samanya/Vishesha, Doshic physiology, and integration with modern biomedical concepts.",
    badgeVariant: "herbal",
  },
  clinical_practical: {
    key: "clinical_practical",
    label: "Clinical & Practical Competencies",
    shortLabel: "Clinical / Practical",
    description: "Rogamarga assessment, Rogi-Roga Pariksha, comprehensive clinical documentation, and empathetic patient consultation.",
    badgeVariant: "saffron",
  },
  research: {
    key: "research",
    label: "Research & Evidence-Based Methodology",
    shortLabel: "Research & Evidence",
    description: "Ayush clinical study designs, biostatistical analysis, observational research, and evidence synthesis.",
    badgeVariant: "parchment",
  },
  professional: {
    key: "professional",
    label: "Professional & Interdisciplinary Practice",
    shortLabel: "Professional Practice",
    description: "NCISM code of ethics, patient autonomy, biomedical safety, and multidisciplinary healthcare team collaboration.",
    badgeVariant: "default",
  },
};

export interface CompetencyProfileItem {
  id: string;
  name: string;
  category: CompetencyCategory;
  description: string | null;
  score: number;
  lastAssessedAt: string | null;
  source: string;
  verified: boolean;
  isPriorityDevelopment: boolean; // MVP rule: score < 60
}

export interface CategorySummary {
  category: CompetencyCategory;
  label: string;
  shortLabel: string;
  score: number;
  competencyCount: number;
  badgeVariant: "herbal" | "saffron" | "parchment" | "default";
}

export interface StudentSkillProfileData {
  hasCompletedAssessment: boolean;
  overallScore: number;
  lastAssessedAt: string | null;
  categorySummaries: Record<CompetencyCategory, CategorySummary>;
  competencies: CompetencyProfileItem[];
  topStrengths: CompetencyProfileItem[];
  priorityDevelopmentAreas: CompetencyProfileItem[];
}

/**
 * Pure calculation function: processes raw student_competencies DB rows
 * joined with competencies into a structured skill profile.
 */
export function buildStudentSkillProfile(
  rawRows: Array<{
    competency_id: string;
    proficiency_score: number | string | null;
    last_assessed_at: string | null;
    source: string | null;
    verified: boolean | null;
    competencies: {
      id: string;
      name: string;
      category: string;
      description: string | null;
    } | Array<{
      id: string;
      name: string;
      category: string;
      description: string | null;
    }> | null;
  }>
): StudentSkillProfileData {
  if (!rawRows || rawRows.length === 0) {
    // Empty state fallback structure
    const emptyCategories: Record<CompetencyCategory, CategorySummary> = {
      academic_domain: {
        category: "academic_domain",
        label: CATEGORY_CONFIG.academic_domain.label,
        shortLabel: CATEGORY_CONFIG.academic_domain.shortLabel,
        score: 0,
        competencyCount: 0,
        badgeVariant: "herbal",
      },
      clinical_practical: {
        category: "clinical_practical",
        label: CATEGORY_CONFIG.clinical_practical.label,
        shortLabel: CATEGORY_CONFIG.clinical_practical.shortLabel,
        score: 0,
        competencyCount: 0,
        badgeVariant: "saffron",
      },
      research: {
        category: "research",
        label: CATEGORY_CONFIG.research.label,
        shortLabel: CATEGORY_CONFIG.research.shortLabel,
        score: 0,
        competencyCount: 0,
        badgeVariant: "parchment",
      },
      professional: {
        category: "professional",
        label: CATEGORY_CONFIG.professional.label,
        shortLabel: CATEGORY_CONFIG.professional.shortLabel,
        score: 0,
        competencyCount: 0,
        badgeVariant: "default",
      },
    };

    return {
      hasCompletedAssessment: false,
      overallScore: 0,
      lastAssessedAt: null,
      categorySummaries: emptyCategories,
      competencies: [],
      topStrengths: [],
      priorityDevelopmentAreas: [],
    };
  }

  const items: CompetencyProfileItem[] = [];
  let latestDate: string | null = null;

  for (const row of rawRows) {
    const comp = Array.isArray(row.competencies) ? row.competencies[0] : row.competencies;
    if (!comp) continue;

    const cat = (comp.category as CompetencyCategory) || "academic_domain";
    const score = Math.round(Number(row.proficiency_score) || 0);

    if (row.last_assessed_at) {
      if (!latestDate || new Date(row.last_assessed_at) > new Date(latestDate)) {
        latestDate = row.last_assessed_at;
      }
    }

    items.push({
      id: comp.id,
      name: comp.name,
      category: cat,
      description: comp.description,
      score,
      lastAssessedAt: row.last_assessed_at,
      source: row.source || "assessment",
      verified: Boolean(row.verified),
      isPriorityDevelopment: score < 60,
    });
  }

  // Calculate category averages
  const categoriesMap: Record<CompetencyCategory, CategorySummary> = {
    academic_domain: {
      category: "academic_domain",
      label: CATEGORY_CONFIG.academic_domain.label,
      shortLabel: CATEGORY_CONFIG.academic_domain.shortLabel,
      score: 0,
      competencyCount: 0,
      badgeVariant: "herbal",
    },
    clinical_practical: {
      category: "clinical_practical",
      label: CATEGORY_CONFIG.clinical_practical.label,
      shortLabel: CATEGORY_CONFIG.clinical_practical.shortLabel,
      score: 0,
      competencyCount: 0,
      badgeVariant: "saffron",
    },
    research: {
      category: "research",
      label: CATEGORY_CONFIG.research.label,
      shortLabel: CATEGORY_CONFIG.research.shortLabel,
      score: 0,
      competencyCount: 0,
      badgeVariant: "parchment",
    },
    professional: {
      category: "professional",
      label: CATEGORY_CONFIG.professional.label,
      shortLabel: CATEGORY_CONFIG.professional.shortLabel,
      score: 0,
      competencyCount: 0,
      badgeVariant: "default",
    },
  };

  const catSums: Record<CompetencyCategory, { sum: number; count: number }> = {
    academic_domain: { sum: 0, count: 0 },
    clinical_practical: { sum: 0, count: 0 },
    research: { sum: 0, count: 0 },
    professional: { sum: 0, count: 0 },
  };

  let totalScoreSum = 0;

  for (const item of items) {
    if (catSums[item.category]) {
      catSums[item.category].sum += item.score;
      catSums[item.category].count += 1;
    }
    totalScoreSum += item.score;
  }

  for (const catKey of Object.keys(catSums) as CompetencyCategory[]) {
    const { sum, count } = catSums[catKey];
    categoriesMap[catKey].competencyCount = count;
    categoriesMap[catKey].score = count > 0 ? Math.round(sum / count) : 0;
  }

  const overallScore = items.length > 0 ? Math.round(totalScoreSum / items.length) : 0;

  // Strengths & Priority Development Areas
  // Sort descending by score for strengths
  const sortedDesc = [...items].sort((a, b) => b.score - a.score);
  const topStrengths = sortedDesc.slice(0, 3);

  // Lowest 3 competencies by score
  const sortedAsc = [...items].sort((a, b) => a.score - b.score);
  const priorityDevelopmentAreas = sortedAsc.slice(0, 3);

  return {
    hasCompletedAssessment: items.length > 0,
    overallScore,
    lastAssessedAt: latestDate,
    categorySummaries: categoriesMap,
    competencies: items,
    topStrengths,
    priorityDevelopmentAreas,
  };
}
