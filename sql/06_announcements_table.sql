-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  target_role text NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'manager', 'employee')),
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Ensure policies are idempotent (re-runnable): ALTER if exists, otherwise CREATE
DO $$
BEGIN
  -- INSERT policy
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'Managers can create announcements'
  ) THEN
    EXECUTE $sql$
      ALTER POLICY "Managers can create announcements" ON public.announcements
      TO authenticated
      WITH CHECK (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND public.is_manager_or_above(auth.uid())
      )
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "Managers can create announcements"
      ON public.announcements
      FOR INSERT
      TO authenticated
      WITH CHECK (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND public.is_manager_or_above(auth.uid())
      )
    $sql$;
  END IF;

  -- SELECT policy
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'Users can view announcements for their company'
  ) THEN
    EXECUTE $sql$
      ALTER POLICY "Users can view announcements for their company" ON public.announcements
      TO authenticated
      USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND (
          target_role = 'all'
          OR (target_role = 'manager' AND public.is_manager_or_above(auth.uid()))
          OR (target_role = 'employee' AND NOT public.is_manager_or_above(auth.uid()))
        )
      )
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "Users can view announcements for their company"
      ON public.announcements
      FOR SELECT
      TO authenticated
      USING (
        company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        AND (
          target_role = 'all'
          OR (target_role = 'manager' AND public.is_manager_or_above(auth.uid()))
          OR (target_role = 'employee' AND NOT public.is_manager_or_above(auth.uid()))
        )
      )
    $sql$;
  END IF;

  -- UPDATE policy
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'Managers can update own announcements'
  ) THEN
    EXECUTE $sql$
      ALTER POLICY "Managers can update own announcements" ON public.announcements
      TO authenticated
      USING (
        created_by = auth.uid()
        AND public.is_manager_or_above(auth.uid())
      )
      WITH CHECK (
        created_by = auth.uid()
        AND public.is_manager_or_above(auth.uid())
      )
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "Managers can update own announcements"
      ON public.announcements
      FOR UPDATE
      TO authenticated
      USING (
        created_by = auth.uid()
        AND public.is_manager_or_above(auth.uid())
      )
      WITH CHECK (
        created_by = auth.uid()
        AND public.is_manager_or_above(auth.uid())
      )
    $sql$;
  END IF;

  -- DELETE policy
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'announcements'
      AND policyname = 'Managers can delete own announcements'
  ) THEN
    EXECUTE $sql$
      ALTER POLICY "Managers can delete own announcements" ON public.announcements
      TO authenticated
      USING (
        created_by = auth.uid()
        AND public.is_manager_or_above(auth.uid())
      )
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "Managers can delete own announcements"
      ON public.announcements
      FOR DELETE
      TO authenticated
      USING (
        created_by = auth.uid()
        AND public.is_manager_or_above(auth.uid())
      )
    $sql$;
  END IF;
END $$;


-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_announcements_company_id ON public.announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
