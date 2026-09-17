import { db } from "../db";

export interface IndustryDashboardMetrics {
  totalOpportunities: number;
  publishedCount: number;
  draftCount: number;
  closedCount: number;
  selectedCandidatesCount: number;
  activePlacementsCount: number;
}

export interface IndustryDashboardData {
  metrics: IndustryDashboardMetrics;
  opportunities: Array<{
    id: string;
    status: string;
    title: string;
    opportunity_type: string;
    application_deadline: string | null;
    created_at: string;
  }>;
}

export class IndustryService {
  /**
   * Industry: Get dashboard metrics and recent opportunities
   */
  async getIndustryDashboard(industryUserId: string): Promise<IndustryDashboardData> {
    // 1. Fetch opportunities created by this industry user
    const oppsRes = await db.query(
      `SELECT id, status, title, opportunity_type, application_deadline, created_at
       FROM public.opportunities
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [industryUserId]
    );

    const opportunities = oppsRes.rows.map((row: any) => ({
      id: row.id,
      status: row.status,
      title: row.title,
      opportunity_type: row.opportunity_type || "internship",
      application_deadline: row.application_deadline
        ? (typeof row.application_deadline === "string" ? row.application_deadline.split("T")[0] : row.application_deadline.toISOString().split("T")[0])
        : null,
      created_at: row.created_at
        ? (typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString())
        : new Date().toISOString(),
    }));

    const publishedCount = opportunities.filter((o) => o.status === "published").length;
    const draftCount = opportunities.filter((o) => o.status === "draft").length;
    const closedCount = opportunities.filter((o) => o.status === "closed" || o.status === "archived").length;
    const totalCount = opportunities.length;

    // 2. Fetch selected applications & active placements for this industry's opportunities
    let selectedCandidatesCount = 0;
    let activePlacementsCount = 0;

    if (opportunities.length > 0) {
      const selectedAppsRes = await db.query(
        `SELECT a.id, ip.id AS placement_id, ip.status AS placement_status
         FROM public.applications a
         JOIN public.opportunities o ON a.opportunity_id = o.id
         LEFT JOIN public.internship_placements ip ON a.id = ip.application_id
         WHERE o.created_by = $1 AND a.status = 'selected'`,
        [industryUserId]
      );

      selectedCandidatesCount = selectedAppsRes.rows.length;
      activePlacementsCount = selectedAppsRes.rows.filter(
        (r: any) => r.placement_id !== null && r.placement_id !== undefined
      ).length;
    }

    return {
      metrics: {
        totalOpportunities: totalCount,
        publishedCount,
        draftCount,
        closedCount,
        selectedCandidatesCount,
        activePlacementsCount,
      },
      opportunities,
    };
  }
}

export const industryService = new IndustryService();
