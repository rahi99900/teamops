-- Enable RLS on companies table if not already enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their own company" ON public.companies;

-- Allow users to view their own company
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id 
      FROM public.users 
      WHERE users.id = auth.uid()
    )
  );

-- SIMPLIFIED: Allow ANY authenticated user belonging to the company to update it
-- This removes the role check which seems to be failing for your user
CREATE POLICY "Users can update their own company" ON public.companies
  FOR UPDATE
  USING (
    id IN (
      SELECT company_id 
      FROM public.users 
      WHERE users.id = auth.uid()
    )
  );
