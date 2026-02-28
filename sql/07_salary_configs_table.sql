-- Create salary_configs table
CREATE TABLE IF NOT EXISTS public.salary_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  applies_to text NOT NULL CHECK (applies_to IN ('global', 'role', 'user')),
  target_id text, -- role name or user id depending on applies_to
  salary_type text NOT NULL CHECK (salary_type IN ('hourly', 'monthly')),
  rate numeric NOT NULL DEFAULT 0,
  overtime_rate numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salary_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "CEO/Admin can view salary configs" ON public.salary_configs;
DROP POLICY IF EXISTS "CEO/Admin can create salary configs" ON public.salary_configs;
DROP POLICY IF EXISTS "CEO/Admin can update salary configs" ON public.salary_configs;
DROP POLICY IF EXISTS "CEO/Admin can delete salary configs" ON public.salary_configs;

-- Only CEO/Admin can view salary configs for their company
CREATE POLICY "CEO/Admin can view salary configs"
ON public.salary_configs
FOR SELECT
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Only CEO/Admin can create salary configs
CREATE POLICY "CEO/Admin can create salary configs"
ON public.salary_configs
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Only CEO/Admin can update salary configs
CREATE POLICY "CEO/Admin can update salary configs"
ON public.salary_configs
FOR UPDATE
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Only CEO/Admin can delete salary configs
CREATE POLICY "CEO/Admin can delete salary configs"
ON public.salary_configs
FOR DELETE
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  AND (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_salary_configs_company_id ON public.salary_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_configs_applies_to ON public.salary_configs(applies_to);

-- Add unique constraint for global config per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_configs_global_unique 
ON public.salary_configs(company_id) 
WHERE applies_to = 'global';

-- Add unique constraint for role config per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_configs_role_unique 
ON public.salary_configs(company_id, target_id) 
WHERE applies_to = 'role';
