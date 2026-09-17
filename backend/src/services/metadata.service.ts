import { db } from "../db";
import { AppError } from "../middleware/error.middleware";

export interface InstitutionItem {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  location: string | null;
  verification_status: string;
  created_at: string;
}

export interface OrganizationItem {
  id: string;
  name: string;
  organization_type: string | null;
  location: string | null;
  verification_status: string;
  created_at: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  source: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CompetencyItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  source: string | null;
  source_reference: string | null;
  is_active: boolean;
  created_at: string;
}

export class MetadataService {
  /**
   * Retrieve approved institutions.
   * Open to authenticated users (and public dropdowns if needed).
   */
  async getInstitutions(options?: { verificationStatus?: string }): Promise<InstitutionItem[]> {
    const status = options?.verificationStatus || "approved";
    const res = await db.query<InstitutionItem>(
      `SELECT id, name, code, category, location, verification_status, created_at
       FROM public.institutions
       WHERE verification_status = $1
       ORDER BY name ASC`,
      [status]
    );
    return res.rows;
  }

  /**
   * Retrieve approved organizations.
   */
  async getOrganizations(options?: { verificationStatus?: string }): Promise<OrganizationItem[]> {
    const status = options?.verificationStatus || "approved";
    const res = await db.query<OrganizationItem>(
      `SELECT id, name, organization_type, location, verification_status, created_at
       FROM public.organizations
       WHERE verification_status = $1
       ORDER BY name ASC`,
      [status]
    );
    return res.rows;
  }

  /**
   * Retrieve active skills, optionally filtered by category.
   */
  async getSkills(category?: string): Promise<SkillItem[]> {
    if (category) {
      const res = await db.query<SkillItem>(
        `SELECT id, name, category, description, source, is_active, created_at
         FROM public.skills
         WHERE is_active = true AND category = $1
         ORDER BY name ASC`,
        [category]
      );
      return res.rows;
    }

    const res = await db.query<SkillItem>(
      `SELECT id, name, category, description, source, is_active, created_at
       FROM public.skills
       WHERE is_active = true
       ORDER BY category ASC, name ASC`
    );
    return res.rows;
  }

  /**
   * Retrieve active competencies, optionally filtered by category.
   * Always guarantees all active competencies (including the 13 canonical Ayurveda competencies).
   */
  async getCompetencies(category?: string): Promise<CompetencyItem[]> {
    if (category) {
      const res = await db.query<CompetencyItem>(
        `SELECT id, name, category, description, source, source_reference, is_active, created_at
         FROM public.competencies
         WHERE is_active = true AND category = $1
         ORDER BY name ASC`,
        [category]
      );
      return res.rows;
    }

    const res = await db.query<CompetencyItem>(
      `SELECT id, name, category, description, source, source_reference, is_active, created_at
       FROM public.competencies
       WHERE is_active = true
       ORDER BY category ASC, name ASC`
    );
    return res.rows;
  }
}

export const metadataService = new MetadataService();
