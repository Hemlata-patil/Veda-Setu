import { db } from "../db";
import { AppError } from "../middleware/error.middleware";
import { UpdateProfileInput } from "../utils/validation";

export interface UserProfileResponse {
  id: string;
  email: string;
  role: string;
  fullName: string;
  phone: string | null;
  institutionId: string | null;
  institutionName?: string | null;
  program: string | null;
  year: number | null;
  department: string | null;
  designation: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProfileService {
  /**
   * Retrieves profile for the authenticated user, strictly joining public.users for email and role
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const res = await db.query(
      `SELECT u.id, u.email, u.role, u.created_at AS user_created_at,
              p.full_name, p.phone, p.institution_id, p.program, p.year,
              p.department, p.designation, p.avatar_url, p.created_at, p.updated_at,
              inst.name AS institution_name
       FROM public.users u
       LEFT JOIN public.profiles p ON u.id = p.id
       LEFT JOIN public.institutions inst ON p.institution_id = inst.id
       WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new AppError("User account not found", 404);
    }

    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.full_name || "",
      phone: row.phone || null,
      institutionId: row.institution_id || null,
      institutionName: row.institution_name || null,
      program: row.program || null,
      year: row.year || null,
      department: row.department || null,
      designation: row.designation || null,
      avatarUrl: row.avatar_url || null,
      createdAt: row.created_at || row.user_created_at,
      updatedAt: row.updated_at || row.user_created_at,
    };
  }

  /**
   * Updates permitted profile fields.
   * Security enforcement:
   * - role and email can NEVER be updated here.
   * - institution_id update is ONLY permitted for student role.
   * - target institution_id must exist and be 'approved'.
   */
  async updateProfile(
    userId: string,
    userRole: string,
    input: UpdateProfileInput
  ): Promise<UserProfileResponse> {
    // 1. If institution_id is provided, check permissions and validation
    let targetInstitutionId: string | null | undefined = undefined;

    if (input.institutionId !== undefined) {
      if (userRole !== "student") {
        throw new AppError("Only student accounts are permitted to change academic institution affiliation.", 403);
      }

      if (input.institutionId !== null) {
        const instRes = await db.query(
          `SELECT id, name, verification_status FROM public.institutions WHERE id = $1`,
          [input.institutionId]
        );

        if (instRes.rows.length === 0) {
          throw new AppError("The selected academic institution does not exist.", 404);
        }

        if (instRes.rows[0].verification_status !== "approved") {
          throw new AppError("The selected academic institution is not approved or verified.", 400);
        }

        targetInstitutionId = instRes.rows[0].id;
      } else {
        targetInstitutionId = null;
      }
    }

    // 2. Fetch existing profile or ensure record exists (UPSERT pattern)
    const existing = await db.query(`SELECT id, institution_id FROM public.profiles WHERE id = $1`, [userId]);

    if (existing.rows.length === 0) {
      // Insert initial profile
      await db.query(
        `INSERT INTO public.profiles (
          id, full_name, phone, department, program, year, avatar_url, institution_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          input.fullName || "",
          input.phone || null,
          input.department || null,
          input.program || null,
          input.year || null,
          input.avatarUrl || null,
          targetInstitutionId !== undefined ? targetInstitutionId : null,
        ]
      );
    } else {
      // Update fields
      const updateFields: string[] = [];
      const updateParams: any[] = [];
      let idx = 1;

      if (input.fullName !== undefined) {
        updateFields.push(`full_name = $${idx++}`);
        updateParams.push(input.fullName);
      }
      if (input.phone !== undefined) {
        updateFields.push(`phone = $${idx++}`);
        updateParams.push(input.phone);
      }
      if (input.department !== undefined) {
        updateFields.push(`department = $${idx++}`);
        updateParams.push(input.department);
      }
      if (input.program !== undefined) {
        updateFields.push(`program = $${idx++}`);
        updateParams.push(input.program);
      }
      if (input.year !== undefined) {
        updateFields.push(`year = $${idx++}`);
        updateParams.push(input.year);
      }
      if (input.avatarUrl !== undefined) {
        updateFields.push(`avatar_url = $${idx++}`);
        updateParams.push(input.avatarUrl);
      }
      if (targetInstitutionId !== undefined) {
        updateFields.push(`institution_id = $${idx++}`);
        updateParams.push(targetInstitutionId);
      }

      if (updateFields.length > 0) {
        updateParams.push(userId);
        await db.query(
          `UPDATE public.profiles SET ${updateFields.join(", ")} WHERE id = $${idx}`,
          updateParams
        );
      }
    }

    return this.getProfile(userId);
  }
}

export const profileService = new ProfileService();
