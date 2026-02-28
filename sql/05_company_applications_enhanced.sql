-- =====================================================
-- Enhanced Company Applications Table
-- Run this AFTER 04_enhanced_user_trigger.sql
-- =====================================================

-- Add missing columns to company_applications
ALTER TABLE public.company_applications 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.users(id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view companies for applying" ON public.companies;
DROP POLICY IF EXISTS "Users can view own applications" ON public.company_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.company_applications;
DROP POLICY IF EXISTS "Managers can view company applications" ON public.company_applications;
DROP POLICY IF EXISTS "Managers can update applications" ON public.company_applications;

-- Allow users without company to view companies for applying
CREATE POLICY "Anyone can view companies for applying"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.company_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create applications
CREATE POLICY "Users can create applications"
  ON public.company_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Managers can view company applications
CREATE POLICY "Managers can view company applications"
  ON public.company_applications FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

-- Managers can update applications
CREATE POLICY "Managers can update applications"
  ON public.company_applications FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );
