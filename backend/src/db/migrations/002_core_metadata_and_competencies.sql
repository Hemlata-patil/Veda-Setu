-- Migration: 002_core_metadata_and_competencies.sql
-- Module 2: Core Metadata, Ayurveda Competencies & Assessment Schema for VEDA SETU

-- =============================================================================
-- 1. CORE METADATA TABLES
-- =============================================================================

-- 1.1 institutions table
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  category TEXT DEFAULT 'Ayurveda College',
  location TEXT DEFAULT 'India',
  verification_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institutions_code ON public.institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_verification_status ON public.institutions(verification_status);

-- 1.2 organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_type TEXT,
  location TEXT,
  verification_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_verification_status ON public.organizations(verification_status);

-- 1.3 skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  source TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_is_active ON public.skills(is_active);

-- 1.4 competencies table
CREATE TABLE IF NOT EXISTS public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('academic_domain', 'clinical_practical', 'research', 'professional')),
  description TEXT,
  source TEXT,
  source_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competencies_category ON public.competencies(category);
CREATE INDEX IF NOT EXISTS idx_competencies_is_active ON public.competencies(is_active);

-- =============================================================================
-- 2. ASSESSMENT FOUNDATION TABLES
-- =============================================================================

-- 2.1 assessment_templates table
CREATE TABLE IF NOT EXISTS public.assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  program TEXT,
  year INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_templates_status ON public.assessment_templates(status);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_created_by ON public.assessment_templates(created_by);

-- 2.2 assessment_questions table
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'self_rating' CHECK (question_type IN ('mcq', 'self_rating')),
  weight NUMERIC NOT NULL DEFAULT 1 CHECK (weight > 0),
  max_score NUMERIC NOT NULL DEFAULT 1 CHECK (max_score > 0),
  options JSONB,
  difficulty TEXT,
  source TEXT,
  source_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assessment_questions_id_template UNIQUE (id, assessment_template_id),
  CONSTRAINT chk_assessment_questions_mcq_options CHECK (question_type != 'mcq' OR options IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_template_id ON public.assessment_questions(assessment_template_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_competency_id ON public.assessment_questions(competency_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_is_active ON public.assessment_questions(is_active);

-- 2.3 assessment_question_keys table (Privileged - isolated from student endpoints)
CREATE TABLE IF NOT EXISTS public.assessment_question_keys (
  question_id UUID PRIMARY KEY REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  correct_answer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 assessment_attempts table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'expired')),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  total_score NUMERIC CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assessment_attempts_template_student UNIQUE (assessment_template_id, student_id),
  CONSTRAINT uq_assessment_attempts_id_template UNIQUE (id, assessment_template_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_id ON public.assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_template_id ON public.assessment_attempts(assessment_template_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);

-- 2.5 assessment_answers table
CREATE TABLE IF NOT EXISTS public.assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  assessment_template_id UUID NOT NULL,
  answer_value NUMERIC,
  answer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assessment_answers_attempt_question UNIQUE (attempt_id, question_id),
  CONSTRAINT fk_assessment_answers_attempt_template
    FOREIGN KEY (attempt_id, assessment_template_id)
    REFERENCES public.assessment_attempts(id, assessment_template_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assessment_answers_question_template
    FOREIGN KEY (question_id, assessment_template_id)
    REFERENCES public.assessment_questions(id, assessment_template_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt_id ON public.assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_id ON public.assessment_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_template_id ON public.assessment_answers(assessment_template_id);

-- 2.6 student_competencies table
CREATE TABLE IF NOT EXISTS public.student_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT,
  proficiency_score NUMERIC CHECK (proficiency_score IS NULL OR (proficiency_score >= 0 AND proficiency_score <= 100)),
  last_assessed_at TIMESTAMPTZ,
  source TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_competencies_student_competency UNIQUE (student_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_student_competencies_student_id ON public.student_competencies(student_id);
CREATE INDEX IF NOT EXISTS idx_student_competencies_competency_id ON public.student_competencies(competency_id);

-- =============================================================================
-- 3. TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assessment_templates_updated_at ON public.assessment_templates;
CREATE TRIGGER trg_assessment_templates_updated_at
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_assessment_updated_at();

DROP TRIGGER IF EXISTS trg_assessment_question_keys_updated_at ON public.assessment_question_keys;
CREATE TRIGGER trg_assessment_question_keys_updated_at
  BEFORE UPDATE ON public.assessment_question_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_assessment_updated_at();

DROP TRIGGER IF EXISTS trg_assessment_attempts_updated_at ON public.assessment_attempts;
CREATE TRIGGER trg_assessment_attempts_updated_at
  BEFORE UPDATE ON public.assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_assessment_updated_at();

DROP TRIGGER IF EXISTS trg_student_competencies_updated_at ON public.student_competencies;
CREATE TRIGGER trg_student_competencies_updated_at
  BEFORE UPDATE ON public.student_competencies
  FOR EACH ROW EXECUTE FUNCTION public.set_assessment_updated_at();
