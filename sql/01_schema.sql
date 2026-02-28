-- =====================================================
-- TeamOps Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('ceo', 'admin', 'manager', 'employee');

-- =====================================================
-- 2. TABLES
-- =====================================================

-- 2.1 Companies (ROOT ENTITY)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  work_start_time TIME DEFAULT '09:00:00',
  work_end_time TIME DEFAULT '18:00:00',
  lunch_start_time TIME DEFAULT '12:00:00',
  lunch_end_time TIME DEFAULT '13:00:00',
  camera_enabled BOOLEAN DEFAULT true,
  verification_limit_per_day INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Users (AUTH-LINKED)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role public.app_role DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 User Roles (SEPARATE TABLE FOR SECURITY)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 2.4 Permissions (ROLE-BASED CONTROL)
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, role, permission_key)
);

-- 2.5 Work Sessions
CREATE TABLE public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  work_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  total_minutes INT,
  status TEXT DEFAULT 'working' CHECK (status IN ('working', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Break Sessions
CREATE TABLE public.break_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_session_id UUID REFERENCES public.work_sessions(id) ON DELETE CASCADE NOT NULL,
  break_start TIMESTAMPTZ NOT NULL,
  break_end TIMESTAMPTZ,
  duration_minutes INT
);

-- 2.7 Attendance Records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'partial', 'leave')),
  total_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

-- 2.8 Verification Requests
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'skipped', 'expired')),
  verification_type TEXT DEFAULT 'photo' CHECK (verification_type IN ('photo', 'video')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.9 Verification Media (METADATA ONLY)
CREATE TABLE public.verification_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('start', 'verify', 'end')),
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 Leave Requests
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.11 Salary Configs
CREATE TABLE public.salary_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('global', 'role', 'user')),
  target_id TEXT,
  salary_type TEXT NOT NULL CHECK (salary_type IN ('hourly', 'monthly')),
  rate NUMERIC NOT NULL,
  overtime_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12 Salary Records
CREATE TABLE public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  total_minutes INT NOT NULL DEFAULT 0,
  overtime_minutes INT NOT NULL DEFAULT 0,
  final_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, month)
);

-- 2.13 Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'manager', 'employee')),
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.14 Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.15 Company Applications
CREATE TABLE public.company_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- =====================================================
-- 3. SECURITY DEFINER FUNCTIONS (FOR RLS)
-- =====================================================

-- 3.1 Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

-- 3.2 Get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = _user_id
$$;

-- 3.3 Check if user is manager or above
CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('manager', 'admin', 'ceo')
  )
$$;

-- 3.4 Handle new user creation (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- 3.5 Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- 5.1 Companies Policies
CREATE POLICY "Users can view their company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "CEO can update company"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Anyone can create company"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5.2 Users Policies
CREATE POLICY "Users can view users in same company"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL 
    OR company_id = public.get_user_company_id(auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Managers can update users in company"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

-- 5.3 User Roles Policies
CREATE POLICY "Users can view their roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "CEO/Admin can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'ceo') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- 5.4 Permissions Policies
CREATE POLICY "Users can view permissions in company"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "CEO can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'ceo')
  );

-- 5.5 Work Sessions Policies
CREATE POLICY "Users can view own work sessions"
  ON public.work_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view company work sessions"
  ON public.work_sessions FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

CREATE POLICY "Users can insert own work sessions"
  ON public.work_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own work sessions"
  ON public.work_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5.6 Break Sessions Policies
CREATE POLICY "Users can manage own breaks"
  ON public.break_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_sessions ws
      WHERE ws.id = work_session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view company breaks"
  ON public.break_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_sessions ws
      WHERE ws.id = work_session_id 
      AND ws.company_id = public.get_user_company_id(auth.uid())
      AND public.is_manager_or_above(auth.uid())
    )
  );

-- 5.7 Attendance Records Policies
CREATE POLICY "Users can view own attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view company attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

CREATE POLICY "System can manage attendance"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- 5.8 Verification Requests Policies
CREATE POLICY "Users can view own verification requests"
  ON public.verification_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view/create company verifications"
  ON public.verification_requests FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

CREATE POLICY "Users can update own verification status"
  ON public.verification_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5.9 Verification Media Policies
CREATE POLICY "Users can manage own verification media"
  ON public.verification_media FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view company verification media"
  ON public.verification_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.verification_requests vr
      WHERE vr.id = verification_request_id
      AND vr.company_id = public.get_user_company_id(auth.uid())
      AND public.is_manager_or_above(auth.uid())
    )
  );

-- 5.10 Leave Requests Policies
CREATE POLICY "Users can view own leave requests"
  ON public.leave_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create leave requests"
  ON public.leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Managers can view/update company leave requests"
  ON public.leave_requests FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

-- 5.11 Salary Configs Policies
CREATE POLICY "Users can view company salary configs"
  ON public.salary_configs FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "CEO/Admin can manage salary configs"
  ON public.salary_configs FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'))
  );

-- 5.12 Salary Records Policies
CREATE POLICY "Users can view own published salary"
  ON public.salary_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND status = 'published');

CREATE POLICY "Managers can view company salaries"
  ON public.salary_records FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

CREATE POLICY "CEO/Admin can manage salaries"
  ON public.salary_records FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'))
  );

-- 5.13 Announcements Policies
CREATE POLICY "Users can view company announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "CEO/Admin can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'admin'))
  );

-- 5.14 Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5.15 Company Applications Policies
CREATE POLICY "Users can view own applications"
  ON public.company_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create applications"
  ON public.company_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can view/manage company applications"
  ON public.company_applications FOR ALL
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.is_manager_or_above(auth.uid())
  );

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_company ON public.users(company_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_work_sessions_user ON public.work_sessions(user_id);
CREATE INDEX idx_work_sessions_company ON public.work_sessions(company_id);
CREATE INDEX idx_work_sessions_date ON public.work_sessions(work_date);
CREATE INDEX idx_attendance_user_date ON public.attendance_records(user_id, date);
CREATE INDEX idx_leave_requests_user ON public.leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX idx_announcements_company ON public.announcements(company_id);
