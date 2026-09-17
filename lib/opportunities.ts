/**
 * Industry Opportunities & Skill Matching Domain Types & Pure Calculations
 */

export type OpportunityType =
  | "internship"
  | "project"
  | "apprenticeship"
  | "entry_level_job";

export type WorkMode = "onsite" | "hybrid" | "remote";

export type OpportunityStatus = "draft" | "published" | "closed" | "archived";

export interface OpportunityCompetencyRequirement {
  competencyId: string;
  competencyName: string;
  category: string;
  requiredScore: number;
  weight: number;
}

export interface CompetencyMatchDetail {
  competencyId: string;
  competencyName: string;
  category: string;
  requiredScore: number;
  weight: number;
  studentScore: number | null;
  isAssessed: boolean;
  isMet: boolean;
  gap: number; // requiredScore - (studentScore || 0), min 0
  status: "Met" | "Development Needed" | "Not Assessed";
}

export interface OpportunitySkillMatchResult {
  hasRequirements: boolean;
  skillMatchPercentage: number | null;
  totalRequirementsCount: number;
  metCount: number;
  details: CompetencyMatchDetail[];
  skillGaps: CompetencyMatchDetail[];
}

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  internship: "Clinical / Research Internship",
  project: "Collaborative Project",
  apprenticeship: "Ayush Apprenticeship",
  entry_level_job: "Entry-Level Position",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

/**
 * Calculates a transparent Skill Match percentage and identifies
 * opportunity-specific skill gaps for a student against an opportunity's required competencies.
 *
 * Algorithm (Part 4):
 * - If studentScore >= requiredScore: full contribution (1.0 * weight)
 * - If studentScore < requiredScore: proportional contribution (studentScore / requiredScore * weight)
 * - If not assessed: 0 contribution
 * - Weighted average across all requirements
 */
export function calculateOpportunitySkillMatch(
  requirements: OpportunityCompetencyRequirement[],
  studentScoresMap: Map<string, number> // competency_id -> proficiency_score
): OpportunitySkillMatchResult {
  if (!requirements || requirements.length === 0) {
    return {
      hasRequirements: false,
      skillMatchPercentage: null,
      totalRequirementsCount: 0,
      metCount: 0,
      details: [],
      skillGaps: [],
    };
  }

  let totalWeight = 0;
  let earnedWeightedScore = 0;
  let metCount = 0;
  const details: CompetencyMatchDetail[] = [];
  const skillGaps: CompetencyMatchDetail[] = [];

  for (const req of requirements) {
    const weight = req.weight > 0 ? Number(req.weight) : 1;
    totalWeight += weight;

    const hasScore = studentScoresMap.has(req.competencyId);
    const studentScore = hasScore ? (studentScoresMap.get(req.competencyId) ?? null) : null;
    const isAssessed = studentScore !== null;
    const isMet = isAssessed && studentScore >= req.requiredScore;

    let contributionRatio = 0;
    let gap = 0;
    let status: "Met" | "Development Needed" | "Not Assessed";

    if (isAssessed) {
      if (studentScore >= req.requiredScore) {
        contributionRatio = 1.0;
        status = "Met";
        metCount++;
        gap = 0;
      } else {
        contributionRatio = Math.max(0, studentScore / req.requiredScore);
        status = "Development Needed";
        gap = Math.round(req.requiredScore - studentScore);
      }
    } else {
      contributionRatio = 0;
      status = "Not Assessed";
      gap = req.requiredScore;
    }

    earnedWeightedScore += contributionRatio * weight;

    const detailItem: CompetencyMatchDetail = {
      competencyId: req.competencyId,
      competencyName: req.competencyName,
      category: req.category,
      requiredScore: req.requiredScore,
      weight,
      studentScore,
      isAssessed,
      isMet,
      gap,
      status,
    };

    details.push(detailItem);

    if (!isMet) {
      skillGaps.push(detailItem);
    }
  }

  const matchPercentage =
    totalWeight > 0 ? Math.round((earnedWeightedScore / totalWeight) * 100) : 0;

  return {
    hasRequirements: true,
    skillMatchPercentage: Math.min(100, Math.max(0, matchPercentage)),
    totalRequirementsCount: requirements.length,
    metCount,
    details,
    skillGaps,
  };
}
