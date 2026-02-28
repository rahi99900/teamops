-- Enable RLS on companies table if not already enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

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

-- Allow company admins/owners to update their company details
CREATE POLICY "Admins can update their own company" ON public.companies
  FOR UPDATE
  USING (
    id IN (
      SELECT company_id 
      FROM public.users 
      WHERE users.id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('ceo', 'admin')
      )
    )
  );

-- Note: Removed the fallback check on public.users.role as that column does not exist.
