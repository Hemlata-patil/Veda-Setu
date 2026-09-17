-- Migration: 007_internship_placements_and_digital_portfolio.sql
-- Module 6: Student Internship & Placement Tracking + Digital Portfolio & Document Attachments

-- =============================================================================
-- 1. TABLE: public.internship_placements
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.internship_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE RESTRICT,
    engagement_type TEXT NOT NULL CHECK (engagement_type IN ('internship', 'placement')),
    status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'offer_accepted', 'joined', 'in_progress', 'completed', 'withdrawn')),
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    progress_percent NUMERIC NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    supervisor_name TEXT,
    supervisor_email TEXT,
    outcome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_internship_placements_application UNIQUE (application_id),
    CONSTRAINT chk_expected_end_date CHECK (expected_end_date IS NULL OR start_date IS NULL OR expected_end_date >= start_date),
    CONSTRAINT chk_actual_end_date CHECK (actual_end_date IS NULL OR start_date IS NULL OR actual_end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_internship_placements_application_id ON public.internship_placements(application_id);
CREATE INDEX IF NOT EXISTS idx_internship_placements_status ON public.internship_placements(status);
CREATE INDEX IF NOT EXISTS idx_internship_placements_engagement_type ON public.internship_placements(engagement_type);

-- Trigger for public.internship_placements updated_at
DROP TRIGGER IF EXISTS trg_internship_placements_updated_at ON public.internship_placements;
CREATE TRIGGER trg_internship_placements_updated_at
    BEFORE UPDATE ON public.internship_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_updated_at();

-- =============================================================================
-- 2. TABLE: public.portfolio_items
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('certification', 'project', 'achievement', 'research', 'publication', 'workshop', 'other')),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT,
    issuer_or_organization TEXT,
    start_date DATE,
    end_date DATE,
    reference_url TEXT,
    achievement TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_portfolio_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_student_id ON public.portfolio_items(student_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_item_type ON public.portfolio_items(item_type);

-- Trigger for public.portfolio_items updated_at
DROP TRIGGER IF EXISTS trg_portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated_at
    BEFORE UPDATE ON public.portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_updated_at();

-- =============================================================================
-- 3. TABLE: public.portfolio_documents
-- Note: NO UNIQUE(portfolio_item_id) constraint, preserving verified schema.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_item_id UUID NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 5242880),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_documents_portfolio_item_id ON public.portfolio_documents(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_documents_student_id ON public.portfolio_documents(student_id);
