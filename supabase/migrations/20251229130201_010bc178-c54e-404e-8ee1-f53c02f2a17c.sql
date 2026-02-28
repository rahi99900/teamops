-- Migration complete: The users.role column has already been dropped.
-- This migration just ensures the helper functions are correctly defined.

-- 1) Ensure has_role function uses only user_roles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2) Ensure is_manager_or_above function uses has_role
CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'ceo')
      OR public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'manager')
$$;