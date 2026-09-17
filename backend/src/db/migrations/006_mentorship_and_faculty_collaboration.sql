-- Migration: 006_mentorship_and_faculty_collaboration.sql
-- Module 5: Student Mentorship & Faculty Collaboration for VEDA SETU

-- =============================================================================
-- 1. TABLE: public.mentorships
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
  request_note TEXT,
  mentor_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index: at most one active or pending mentorship per (faculty, student) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentorships_active_or_pending
  ON public.mentorships (faculty_id, student_id)
  WHERE status IN ('pending', 'active');

CREATE INDEX IF NOT EXISTS idx_mentorships_faculty_id ON public.mentorships(faculty_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_student_id ON public.mentorships(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON public.mentorships(status);
CREATE INDEX IF NOT EXISTS idx_mentorships_requested_by ON public.mentorships(requested_by);

-- =============================================================================
-- 2. TABLE: public.faculty_opportunities
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  opportunity_type TEXT NOT NULL
    CHECK (opportunity_type IN ('fdp', 'workshop', 'research_project', 'industry_collaboration')),
  provider_name TEXT,
  location TEXT,
  mode TEXT CHECK (mode IS NULL OR mode IN ('onsite', 'hybrid', 'remote')),
  start_date DATE,
  end_date DATE,
  application_deadline DATE,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_opportunities_status ON public.faculty_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_faculty_opportunities_type ON public.faculty_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_faculty_opportunities_created_by ON public.faculty_opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_faculty_opportunities_organization_id ON public.faculty_opportunities(organization_id);

-- =============================================================================
-- 3. TABLE: public.faculty_opportunity_interests
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_opportunity_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.faculty_opportunities(id) ON DELETE RESTRICT,
  faculty_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_faculty_opportunity_interests UNIQUE (opportunity_id, faculty_id)
);

CREATE INDEX IF NOT EXISTS idx_faculty_interests_faculty_id ON public.faculty_opportunity_interests(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_interests_opportunity_id ON public.faculty_opportunity_interests(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_faculty_interests_status ON public.faculty_opportunity_interests(status);

-- =============================================================================
-- 4. TRIGGERS: Reusing public.handle_profile_updated_at from Migration 005
-- =============================================================================
DROP TRIGGER IF EXISTS trg_mentorships_updated_at ON public.mentorships;
CREATE TRIGGER trg_mentorships_updated_at
  BEFORE UPDATE ON public.mentorships
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();

DROP TRIGGER IF EXISTS trg_faculty_opportunities_updated_at ON public.faculty_opportunities;
CREATE TRIGGER trg_faculty_opportunities_updated_at
  BEFORE UPDATE ON public.faculty_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();

DROP TRIGGER IF EXISTS trg_faculty_opportunity_interests_updated_at ON public.faculty_opportunity_interests;
CREATE TRIGGER trg_faculty_opportunity_interests_updated_at
  BEFORE UPDATE ON public.faculty_opportunity_interests
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();
