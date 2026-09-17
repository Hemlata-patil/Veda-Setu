import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters long"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
  role: z
    .enum(["student"], {
      errorMap: () => ({
        message:
          "Public registration is restricted exclusively to students. Privileged accounts (faculty, institution, industry, super_admin) must be provisioned through administrative workflows.",
      }),
    })
    .default("student")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: "Reset token is required" })
    .min(1, "Reset token cannot be empty"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
});

export const updatePasswordSchema = z.object({
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// Module 2 Validation Schemas
export const uuidSchema = z.string().uuid("Invalid UUID format");

export const uuidParamSchema = z.object({
  id: uuidSchema,
});

export const attemptParamSchema = z.object({
  attemptId: uuidSchema,
});

export const saveAnswerSchema = z.object({
  questionId: uuidSchema,
  answerValue: z.number().nullable().optional(),
  answerText: z.string().nullable().optional(),
});

export const saveAnswersBatchSchema = z.object({
  answers: z.array(saveAnswerSchema).min(1, "At least one answer must be provided"),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SaveAnswersBatchInput = z.infer<typeof saveAnswersBatchSchema>;

// Module 3 Validation Schemas
export const opportunityTypeEnum = z.enum([
  "internship",
  "project",
  "apprenticeship",
  "entry_level_job",
]);

export const workModeEnum = z.enum(["onsite", "hybrid", "remote"]);

export const opportunityStatusEnum = z.enum([
  "draft",
  "published",
  "closed",
  "archived",
]);

export const applicationStatusEnum = z.enum([
  "applied",
  "under_review",
  "shortlisted",
  "rejected",
  "selected",
  "withdrawn",
]);

export const requiredCompetencySchema = z.object({
  competencyId: uuidSchema,
  requiredScore: z.number().min(0).max(100).default(60),
  weight: z.number().positive().default(1).optional(),
});

export const createOpportunitySchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters long"),
  description: z.string().trim().min(5, "Description must be at least 5 characters long"),
  opportunityType: opportunityTypeEnum,
  location: z.string().trim().nullable().optional(),
  workMode: workModeEnum.nullable().optional(),
  eligibility: z.string().trim().nullable().optional(),
  applicationDeadline: z.string().trim().nullable().optional(),
  organizationName: z.string().trim().nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  requiredCompetencies: z.array(requiredCompetencySchema).optional().default([]),
});

export const updateOpportunitySchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().min(5).optional(),
  opportunityType: opportunityTypeEnum.optional(),
  location: z.string().trim().nullable().optional(),
  workMode: workModeEnum.nullable().optional(),
  eligibility: z.string().trim().nullable().optional(),
  applicationDeadline: z.string().trim().nullable().optional(),
  status: opportunityStatusEnum.optional(),
  requiredCompetencies: z.array(requiredCompetencySchema).optional(),
});

export const updateOpportunityStatusSchema = z.object({
  status: opportunityStatusEnum,
});

export const applyOpportunitySchema = z.object({
  coverNote: z.string().trim().max(3000, "Cover note cannot exceed 3000 characters").optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusEnum,
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type UpdateOpportunityStatusInput = z.infer<typeof updateOpportunityStatusSchema>;
export type ApplyOpportunityInput = z.infer<typeof applyOpportunitySchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

// Module 4 Validation Schemas
export const createFacultySchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters long"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  department: z.string().trim().min(2, "Department is required"),
  designation: z.string().trim().min(2, "Designation is required"),
  temporaryPassword: z.string().min(6, "Temporary password must be at least 6 characters long"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters long").optional(),
  phone: z.string().trim().nullable().optional(),
  department: z.string().trim().nullable().optional(),
  program: z.string().trim().nullable().optional(),
  year: z.number().int().min(1).max(10).nullable().optional(),
  avatarUrl: z.string().trim().nullable().optional(),
  institutionId: uuidSchema.nullable().optional(),
});

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Module 5 Validation Schemas (Mentorship & Faculty Collaboration)
export const requestMentorshipSchema = z.object({
  facultyId: uuidSchema,
  requestNote: z.string().trim().max(2000, "Request note cannot exceed 2000 characters").optional(),
});

export const initiateMentorshipSchema = z.object({
  studentId: uuidSchema,
  mentorNote: z.string().trim().max(3000, "Mentor note cannot exceed 3000 characters").optional(),
});

export const updateMentorNoteSchema = z.object({
  mentorNote: z.string().trim().max(3000, "Mentor note cannot exceed 3000 characters"),
});

export const facultyOpportunityTypeEnum = z.enum(["fdp", "workshop", "research_project", "industry_collaboration"]);
export const facultyOpportunityModeEnum = z.enum(["onsite", "hybrid", "remote"]);
export const facultyOpportunityStatusEnum = z.enum(["draft", "published", "closed", "archived"]);

export const createFacultyOpportunitySchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  opportunityType: facultyOpportunityTypeEnum,
  providerName: z.string().trim().nullable().optional(),
  location: z.string().trim().nullable().optional(),
  mode: facultyOpportunityModeEnum.nullable().optional(),
  startDate: z.string().trim().nullable().optional(),
  endDate: z.string().trim().nullable().optional(),
  applicationDeadline: z.string().trim().nullable().optional(),
  externalUrl: z.string().trim().url("Invalid URL format").nullable().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const updateFacultyOpportunitySchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(10).optional(),
  opportunityType: facultyOpportunityTypeEnum.optional(),
  providerName: z.string().trim().nullable().optional(),
  location: z.string().trim().nullable().optional(),
  mode: facultyOpportunityModeEnum.nullable().optional(),
  startDate: z.string().trim().nullable().optional(),
  endDate: z.string().trim().nullable().optional(),
  applicationDeadline: z.string().trim().nullable().optional(),
  externalUrl: z.string().trim().url().nullable().optional(),
});

export const updateFacultyOpportunityStatusSchema = z.object({
  status: facultyOpportunityStatusEnum,
});

export const expressFacultyInterestSchema = z.object({
  message: z.string().trim().max(3000, "Statement message cannot exceed 3000 characters").optional(),
});

export const updateFacultyInterestMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(3000, "Message cannot exceed 3000 characters"),
});

export const updateFacultyInterestStatusSchema = z.object({
  status: z.enum(["under_review", "accepted", "rejected"]),
});

export type RequestMentorshipInput = z.infer<typeof requestMentorshipSchema>;
export type InitiateMentorshipInput = z.infer<typeof initiateMentorshipSchema>;
export type UpdateMentorNoteInput = z.infer<typeof updateMentorNoteSchema>;
export type CreateFacultyOpportunityInput = z.infer<typeof createFacultyOpportunitySchema>;
export type UpdateFacultyOpportunityInput = z.infer<typeof updateFacultyOpportunitySchema>;
export type UpdateFacultyOpportunityStatusInput = z.infer<typeof updateFacultyOpportunityStatusSchema>;
export type ExpressFacultyInterestInput = z.infer<typeof expressFacultyInterestSchema>;
export type UpdateFacultyInterestMessageInput = z.infer<typeof updateFacultyInterestMessageSchema>;
export type UpdateFacultyInterestStatusInput = z.infer<typeof updateFacultyInterestStatusSchema>;

// =============================================================================
// MODULE 6: INTERNSHIP / PLACEMENT & DIGITAL PORTFOLIO SCHEMAS
// =============================================================================

export const engagementTypeEnum = z.enum(["internship", "placement"]);
export const placementStatusEnum = z.enum([
  "selected",
  "offer_accepted",
  "joined",
  "in_progress",
  "completed",
  "withdrawn",
]);

export const createPlacementTrackingSchema = z
  .object({
    applicationId: z.string().uuid("Invalid application ID"),
    engagementType: engagementTypeEnum,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD").optional().nullable(),
    expectedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected end date must be YYYY-MM-DD").optional().nullable(),
    supervisorName: z.string().trim().max(255).optional().nullable(),
    supervisorEmail: z.string().trim().email("Invalid supervisor email").optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.expectedEndDate) {
        return new Date(data.expectedEndDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "Expected end date cannot be earlier than start date", path: ["expectedEndDate"] }
  );

export const updatePlacementTrackingSchema = z
  .object({
    status: placementStatusEnum.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD").optional().nullable(),
    expectedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected end date must be YYYY-MM-DD").optional().nullable(),
    actualEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Actual end date must be YYYY-MM-DD").optional().nullable(),
    progressPercent: z.number().min(0).max(100, "Progress must be between 0 and 100").optional(),
    supervisorName: z.string().trim().max(255).optional().nullable(),
    supervisorEmail: z.string().trim().email("Invalid supervisor email").optional().nullable(),
    outcome: z.string().trim().max(5000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.expectedEndDate) {
        return new Date(data.expectedEndDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "Expected end date cannot be earlier than start date", path: ["expectedEndDate"] }
  )
  .refine(
    (data) => {
      if (data.startDate && data.actualEndDate) {
        return new Date(data.actualEndDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "Actual end date cannot be earlier than start date", path: ["actualEndDate"] }
  );

export const portfolioItemTypeEnum = z.enum([
  "certification",
  "project",
  "achievement",
  "research",
  "publication",
  "workshop",
  "other",
]);

export const createPortfolioItemSchema = z
  .object({
    itemType: portfolioItemTypeEnum,
    title: z.string().trim().min(1, "Title is required and cannot be empty").max(500),
    description: z.string().trim().max(5000).optional().nullable(),
    issuerOrOrganization: z.string().trim().max(255).optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD").optional().nullable(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD").optional().nullable(),
    referenceUrl: z.string().trim().url("Invalid reference URL").optional().nullable(),
    achievement: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "End date cannot be earlier than start date", path: ["endDate"] }
  );

export const updatePortfolioItemSchema = z
  .object({
    itemType: portfolioItemTypeEnum.optional(),
    title: z.string().trim().min(1, "Title is required and cannot be empty").max(500).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    issuerOrOrganization: z.string().trim().max(255).optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD").optional().nullable(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD").optional().nullable(),
    referenceUrl: z.string().trim().url("Invalid reference URL").optional().nullable(),
    achievement: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "End date cannot be earlier than start date", path: ["endDate"] }
  );

export type CreatePlacementTrackingInput = z.infer<typeof createPlacementTrackingSchema>;
export type UpdatePlacementTrackingInput = z.infer<typeof updatePlacementTrackingSchema>;
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;
