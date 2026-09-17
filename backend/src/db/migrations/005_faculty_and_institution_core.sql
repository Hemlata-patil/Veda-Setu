-- Migration: 005_faculty_and_institution_core.sql
-- Module 4: Profiles, Faculty & Institution Core for VEDA SETU

-- =============================================================================
-- 1. TABLE: public.profiles
-- Canonical user identity remains public.users.id.
-- Canonical role remains public.users.role.
-- Canonical email remains public.users.email.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  program TEXT,
  year INTEGER,
  department TEXT,
  designation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_designation ON public.profiles(designation);
CREATE INDEX IF NOT EXISTS idx_profiles_institution_lookup ON public.profiles(institution_id, id);

-- Trigger for profiles updated_at
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();
