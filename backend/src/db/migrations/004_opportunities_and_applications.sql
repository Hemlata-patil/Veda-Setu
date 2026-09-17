-- Migration: 004_opportunities_and_applications.sql
-- Module 3: Opportunities, Competencies, Applications & Matching for VEDA SETU

-- =============================================================================
-- 1. TABLE: public.opportunities
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type TEXT NOT NULL
    CHECK (opportunity_type IN ('internship', 'project', 'apprenticeship', 'entry_level_job')),
  location TEXT,
  work_mode TEXT
    CHECK (work_mode IS NULL OR work_mode IN ('onsite', 'hybrid', 'remote')),
  eligibility TEXT,
  application_deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON public.opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id ON public.opportunities(organization_id);

-- Trigger for opportunities updated_at
CREATE OR REPLACE FUNCTION public.handle_opportunity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_opportunity_updated_at();

-- =============================================================================
-- 2. TABLE: public.opportunity_competencies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.opportunity_competencies (
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT,
  required_score NUMERIC NOT NULL DEFAULT 60
    CHECK (required_score BETWEEN 0 AND 100),
  weight NUMERIC NOT NULL DEFAULT 1
    CHECK (weight > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (opportunity_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_competencies_comp_id ON public.opportunity_competencies(competency_id);

-- =============================================================================
-- 3. TABLE: public.applications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'under_review', 'shortlisted', 'rejected', 'selected', 'withdrawn')),
  cover_note TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_applications_opportunity_student UNIQUE (opportunity_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Trigger for applications updated_at
CREATE OR REPLACE FUNCTION public.handle_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_applications_updated_at();
