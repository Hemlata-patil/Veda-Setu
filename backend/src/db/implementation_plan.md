# Implementation Plan - Module 2: Core Metadata & Competencies

Migrate core metadata (institutions, organizations, skills, competencies) and the skill-assessment foundation (templates, questions, protected question keys, attempts, answers, student competencies, scoring logic) from the existing Supabase implementation into the traditional PostgreSQL + Express backend (`/backend`).

## User Review Required

> [!IMPORTANT]
> - Existing Supabase database, migrations, and frontend remain completely untouched and operational.
> - Answer keys (`assessment_question_keys`) are strictly isolated in a separate table and excluded from all public/student-facing endpoints. Answer evaluation is conducted only on trusted server-side transactions.
> - The 13 official Ayurveda competencies from `20260910071151_seed_ayurveda_competencies.sql` and the 26 initial assessment questions (13 MCQs with keys, 13 Self-Rating) from `20260910075519_seed_initial_assessment.sql` are preserved without inventing new ones.
> - Scoring logic reproduces the exact weighted formula (80% MCQ + 20% Self-Rating [1=20, 2=40, 3=60, 4=80, 5=100]) from `app/student/assessment/actions.ts`.

## Proposed Changes

### Database Migrations (`backend/src/db/migrations/`)

#### [NEW] `002_core_metadata_and_competencies.sql`
- Create `institutions` table: `id` (UUID default gen_random_uuid()), `name` (TEXT NOT NULL), `code` (TEXT UNIQUE), `created_at` (TIMESTAMPTZ).
- Create `organizations` table: `id` (UUID default gen_random_uuid()), `name` (TEXT NOT NULL), `organization_type` (TEXT), `location` (TEXT), `created_at` (TIMESTAMPTZ).
- Create `skills` table: `id` (UUID default gen_random_uuid()), `name` (TEXT NOT NULL UNIQUE), `category` (TEXT NOT NULL), `description` (TEXT), `source` (TEXT), `is_active` (BOOLEAN DEFAULT true), `created_at` (TIMESTAMPTZ).
- Create `competencies` table: `id` (UUID default gen_random_uuid()), `name` (TEXT NOT NULL UNIQUE), `category` (TEXT NOT NULL CHECK in ('academic_domain', 'clinical_practical', 'research', 'professional')), `description` (TEXT), `source` (TEXT), `source_reference` (TEXT), `is_active` (BOOLEAN DEFAULT true), `created_at` (TIMESTAMPTZ).
- Create `assessment_templates` table: `id` (UUID default gen_random_uuid()), `title` (TEXT NOT NULL), `description` (TEXT), `program` (TEXT), `year` (INTEGER), `status` (TEXT NOT NULL DEFAULT 'draft' CHECK in ('draft', 'published', 'archived')), `created_by` (UUID REFERENCES public.users(id) ON DELETE SET NULL), `published_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- Create `assessment_questions` table: `id` (UUID default gen_random_uuid()), `assessment_template_id` (UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE), `competency_id` (UUID NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT), `question` (TEXT NOT NULL), `question_type` (TEXT NOT NULL DEFAULT 'self_rating' CHECK in ('mcq', 'self_rating')), `weight` (NUMERIC NOT NULL DEFAULT 1 CHECK (weight > 0)), `max_score` (NUMERIC NOT NULL DEFAULT 1 CHECK (max_score > 0)), `options` (JSONB), `difficulty` (TEXT), `source` (TEXT), `source_reference` (TEXT), `is_active` (BOOLEAN NOT NULL DEFAULT true), `created_at` (TIMESTAMPTZ), `uq_assessment_questions_id_template` UNIQUE (`id`, `assessment_template_id`).
- Create `assessment_question_keys` table: `question_id` (UUID PRIMARY KEY REFERENCES public.assessment_questions(id) ON DELETE CASCADE), `correct_answer` (JSONB NOT NULL), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- Create `assessment_attempts` table: `id` (UUID default gen_random_uuid()), `assessment_template_id` (UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE RESTRICT), `student_id` (UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE), `status` (TEXT NOT NULL DEFAULT 'not_started' CHECK in ('not_started', 'in_progress', 'submitted', 'expired')), `started_at` (TIMESTAMPTZ), `submitted_at` (TIMESTAMPTZ), `total_score` (NUMERIC CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= 100))), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ), `uq_assessment_attempts_template_student` UNIQUE (`assessment_template_id`, `student_id`), `uq_assessment_attempts_id_template` UNIQUE (`id`, `assessment_template_id`).
- Create `assessment_answers` table: `id` (UUID default gen_random_uuid()), `attempt_id` (UUID NOT NULL), `question_id` (UUID NOT NULL), `assessment_template_id` (UUID NOT NULL), `answer_value` (NUMERIC), `answer_text` (TEXT), `created_at` (TIMESTAMPTZ), `uq_assessment_answers_attempt_question` UNIQUE (`attempt_id`, `question_id`), FK to attempts (`attempt_id`, `assessment_template_id`), FK to questions (`question_id`, `assessment_template_id`).
- Create `student_competencies` table: `id` (UUID default gen_random_uuid()), `student_id` (UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE), `competency_id` (UUID NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT), `proficiency_score` (NUMERIC CHECK (proficiency_score IS NULL OR (proficiency_score >= 0 AND proficiency_score <= 100))), `last_assessed_at` (TIMESTAMPTZ), `source` (TEXT), `verified` (BOOLEAN NOT NULL DEFAULT false), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ), `uq_student_competencies_student_competency` UNIQUE (`student_id`, `competency_id`).
- Indexes & Triggers: Composite indexes on foreign keys, `idx_competencies_category`, `idx_assessment_questions_template_id`, `set_assessment_updated_at` triggers.

#### [NEW] `003_seed_ayurveda_assessment_data.sql`
- Seed the 13 canonical Ayurveda competencies (Ayurvedic Foundational Understanding, Application of Ayurvedic Concepts, Contemporary Medical Understanding, Clinical History and Examination, Clinical Interpretation, Patient Communication, Clinical Documentation and Record Keeping, Research Methodology, Statistical Understanding, Evidence-Based Practice, Scientific Communication, Professional Ethics and Conduct, Teamwork and Professional Communication).
- Seed the default "Ayush Skill & Competency Assessment" published template.
- Seed the 26 assessment questions (13 MCQs, 13 Self-Rating) with exact texts, options, sources.
- Seed the 13 protected answer keys for the MCQs.

---

### Backend Services & Controllers (`backend/src/`)

#### [NEW] `src/services/metadata.service.ts`
- `getInstitutions()`
- `getOrganizations()`
- `getSkills(category?)`
- `getCompetencies(category?)`

#### [NEW] `src/services/assessment.service.ts`
- `getPublishedTemplates()`
- `getTemplateById(templateId)`: Validates published status, returns template metadata.
- `getAssessmentQuestions(templateId)`: Strictly projects only student-safe columns (`id`, `competency_id`, `question`, `question_type`, `options`, `weight`, `max_score`, `difficulty`), NEVER joins or selects from `assessment_question_keys`.
- `startAttempt(studentId, templateId)`: Creates or resumes attempt, setting `status = 'in_progress'` and `started_at = NOW()`. Checks template is published.
- `getAttempt(attemptId, studentId)`: Validates student ownership of attempt; returns attempt details and submitted answers.
- `saveAnswers(attemptId, studentId, answers)`: Validates attempt is in progress and owned by student; validates question belongs to attempt's template; upserts answers within transaction.
- `completeAttempt(attemptId, studentId)`:
  - Transaction:
    1. Lock attempt row, verify status is `in_progress` and student owns it.
    2. Load questions and answers for attempt.
    3. Load protected keys from `assessment_question_keys` (privileged backend query).
    4. Execute exact scoring formula: 80% MCQ + 20% Self-Rating (scale 1:20, 2:40, 3:60, 4:80, 5:100).
    5. Calculate overall attempt score (0-100).
    6. Upsert results into `student_competencies` for student (`student_id`, `competency_id`, `proficiency_score`, `last_assessed_at`, `source`).
    7. Update attempt: `status = 'submitted'`, `total_score = overallScore`, `submitted_at = NOW()`.
  - Returns overall score and competency breakdown.

#### [NEW] `src/services/student-competency.service.ts`
- `getStudentCompetencies(studentId)`: Retrieves competency scores, names, categories, and last_assessed_at for the authenticated student.

#### [NEW] `src/controllers/metadata.controller.ts`
- Handlers for `GET /api/institutions`, `GET /api/organizations`, `GET /api/skills`, `GET /api/competencies`.

#### [NEW] `src/controllers/assessment.controller.ts`
- Handlers for:
  - `GET /api/assessments`
  - `GET /api/assessments/:id`
  - `GET /api/assessments/:id/questions`
  - `POST /api/assessments/:id/attempts`
  - `GET /api/assessments/attempts/:attemptId`
  - `POST /api/assessments/attempts/:attemptId/answers`
  - `POST /api/assessments/attempts/:attemptId/complete`

#### [NEW] `src/controllers/student-competency.controller.ts`
- Handler for `GET /api/students/me/competencies`.

#### [NEW] `src/routes/metadata.routes.ts`, `src/routes/assessment.routes.ts`, `src/routes/student.routes.ts`
- Mount endpoints with proper validation (`validateRequest`) and authorization middleware (`requireAuth`, `requireRole('student')`).

#### [MODIFY] `src/routes/index.ts`
- Mount metadata routes at `/institutions`, `/organizations`, `/skills`, `/competencies`.
- Mount assessment routes at `/assessments`.
- Mount student competency routes at `/students`.

---

### Validation & Security Layer (`backend/src/utils/`, `backend/src/middleware/`)

- Zod schemas in `src/utils/validation.ts`:
  - `uuidParamSchema`
  - `saveAnswersSchema` (array of `{ questionId: UUID, answerValue?: number, answerText?: string }`)
  - `startAttemptSchema`
- Ensure all queries are parameterized (`$1`, `$2`).
- Answer keys are never selected in any student route or controller.

---

## Verification Plan

### Automated Tests
- Create `backend/scripts/test-module2-competencies.ts` covering:
  - A. Institutions retrieval
  - B. Organizations retrieval
  - C. Skills retrieval
  - D. Competencies retrieval (all 13 Ayurveda competencies verified)
  - E. Published assessment retrieval
  - F. Assessment questions retrieval
  - G. Answer keys NOT exposed in any student response
  - H. Student can start an assessment attempt
  - I. Student cannot access or modify another student's attempt (ownership isolation)
  - J. Student can submit answers
  - K. Invalid question/attempt IDs rejected
  - L. Student can complete assessment
  - M. Score calculation matches exact formula (80% MCQ + 20% Self-Rating)
  - N. Student competency records created/updated
  - O. Student can retrieve their own competency results
  - P. Unauthenticated access returns 401
  - Q. Unauthorized role access returns 403 where applicable
  - R. Attempting duplicate completion or invalid state transitions handled cleanly
  - S. Transaction rollback verification on mid-scoring error
- Execute:
  - `npm run migrate` in `/backend`
  - `npm run build` in `/backend`
  - `tsx scripts/test-module2-competencies.ts` in `/backend`
  - `npm test` in `/backend` (Module 1 regression check)
  - Root `npm run build` (Next.js frontend build check)
