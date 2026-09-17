-- Migration: 008_super_admin_profiles_organization.sql
-- Module 7C-11: Super Admin & Industry Organization Profile Association

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
