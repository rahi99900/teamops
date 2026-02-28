-- Create permissions table for custom role permissions per company
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  permission_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, role, permission_key)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "CEO/Admin can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "CEO can create permissions" ON public.permissions;
DROP POLICY IF EXISTS "CEO can update permissions" ON public.permissions;
DROP POLICY IF EXISTS "CEO can delete permissions" ON public.permissions;

-- Policies for permissions

-- CEO/Admin can view permissions for their company
CREATE POLICY "CEO/Admin can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Only CEO can create permissions
CREATE POLICY "CEO can create permissions"
ON public.permissions
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND public.has_role(auth.uid(), 'ceo')
);

-- Only CEO can update permissions
CREATE POLICY "CEO can update permissions"
ON public.permissions
FOR UPDATE
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND public.has_role(auth.uid(), 'ceo')
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND public.has_role(auth.uid(), 'ceo')
);

-- Only CEO can delete permissions
CREATE POLICY "CEO can delete permissions"
ON public.permissions
FOR DELETE
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND public.has_role(auth.uid(), 'ceo')
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_permissions_company_id ON public.permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON public.permissions(role);
