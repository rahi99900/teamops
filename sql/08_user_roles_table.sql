-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('ceo', 'admin', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for additional role management
-- Note: Primary role is stored in users.role, this table can be used for multiple roles per user
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id AND role = _role
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is manager or above
CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id AND role IN ('ceo', 'admin', 'manager')
  )
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEO/Admin can view all roles in company" ON public.user_roles;
DROP POLICY IF EXISTS "CEO can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEO can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEO can delete roles" ON public.user_roles;

-- Policies for user_roles

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- CEO/Admin can view all roles in their company
CREATE POLICY "CEO/Admin can view all roles in company"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u1
    JOIN public.users u2 ON u1.company_id = u2.company_id
    WHERE u1.id = user_id 
    AND u2.id = auth.uid()
    AND (u2.role = 'ceo' OR u2.role = 'admin')
  )
);

-- Only CEO can assign roles
CREATE POLICY "CEO can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'ceo')
  AND EXISTS (
    SELECT 1 FROM public.users u1
    JOIN public.users u2 ON u1.company_id = u2.company_id
    WHERE u1.id = user_id AND u2.id = auth.uid()
  )
);

-- Only CEO can update roles
CREATE POLICY "CEO can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo')
  AND EXISTS (
    SELECT 1 FROM public.users u1
    JOIN public.users u2 ON u1.company_id = u2.company_id
    WHERE u1.id = user_id AND u2.id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'ceo')
  AND EXISTS (
    SELECT 1 FROM public.users u1
    JOIN public.users u2 ON u1.company_id = u2.company_id
    WHERE u1.id = user_id AND u2.id = auth.uid()
  )
);

-- Only CEO can delete roles
CREATE POLICY "CEO can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo')
  AND EXISTS (
    SELECT 1 FROM public.users u1
    JOIN public.users u2 ON u1.company_id = u2.company_id
    WHERE u1.id = user_id AND u2.id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
