-- Migration: Remove deprecated public.users.role column
-- Roles are stored exclusively in public.user_roles.

-- 1) Make role helper functions independent from public.users.role (safe to re-run)
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

-- 2) Fix user_roles policies that depended on public.users.role
--    (drop + recreate to remove dependency so the column can be dropped)
DROP POLICY IF EXISTS "CEO/Admin can view all roles in company" ON public.user_roles;
CREATE POLICY "CEO/Admin can view all roles in company"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'))
  AND EXISTS (
    SELECT 1
    FROM public.users u1
    JOIN public.users u2 ON u1.company_id = u2.company_id
    WHERE u1.id = user_id
      AND u2.id = auth.uid()
  )
);

-- 3) Migrate any existing public.users.role values into public.user_roles
--    Works whether users.role is TEXT or app_role (we cast to text safely first).
WITH to_migrate AS (
  SELECT
    u.id AS user_id,
    NULLIF(BTRIM(u.role::text), '') AS role_text
  FROM public.users u
  WHERE u.role IS NOT NULL
)
INSERT INTO public.user_roles (user_id, role)
SELECT
  user_id,
  role_text::public.app_role
FROM to_migrate
WHERE role_text IN ('ceo', 'admin', 'manager', 'employee')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4) Drop the deprecated column only if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users DROP COLUMN role;
  END IF;
END $$;
