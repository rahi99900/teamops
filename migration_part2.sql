-- ========================================
-- PART 2: FUNCTIONS AND DATA
-- Run this AFTER Part 1 completes successfully
-- ========================================

-- STEP 3: Create RPC function for handling applications
CREATE OR REPLACE FUNCTION public.handle_application(
  p_application_id UUID,
  p_action TEXT,
  p_role TEXT
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_role_casted app_role;
BEGIN
  -- Get application details
  SELECT user_id, company_id INTO v_user_id, v_company_id
  FROM public.company_applications
  WHERE id = p_application_id;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF p_action = 'approve' THEN
    -- Cast role to enum type
    v_role_casted := p_role::app_role;
    
    -- Update application
    UPDATE public.company_applications 
    SET status = 'approved',
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = p_application_id;
    
    -- Activate user in company
    UPDATE public.users 
    SET company_id = v_company_id, 
        is_active = true
    WHERE id = v_user_id;
    
    -- Assign role (remove existing first to avoid conflicts)
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, v_role_casted);
    
    RETURN json_build_object('success', true);
    
  ELSIF p_action = 'reject' THEN
    UPDATE public.company_applications 
    SET status = 'rejected',
        processed_at = NOW(),
        processed_by = auth.uid()
    WHERE id = p_application_id;
    
    RETURN json_build_object('success', true);
    
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 4: Create function to seed default permissions
CREATE OR REPLACE FUNCTION seed_default_permissions(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete existing permissions first
  DELETE FROM public.permissions WHERE company_id = p_company_id;
  
  -- Admin permissions
  INSERT INTO public.permissions (company_id, role, permission_key)
  VALUES 
    (p_company_id, 'admin'::app_role, 'dashboard'),
    (p_company_id, 'admin'::app_role, 'manager-dashboard'),
    (p_company_id, 'admin'::app_role, 'team'),
    (p_company_id, 'admin'::app_role, 'verifications-control'),
    (p_company_id, 'admin'::app_role, 'reports'),
    (p_company_id, 'admin'::app_role, 'company-settings'),
    (p_company_id, 'admin'::app_role, 'salary-config'),
    (p_company_id, 'admin'::app_role, 'staff-requests'),
    (p_company_id, 'admin'::app_role, 'salary'),
    (p_company_id, 'admin'::app_role, 'work-time-control'),
    (p_company_id, 'admin'::app_role, 'leave-requests'),
    (p_company_id, 'admin'::app_role, 'announcements');
  
  -- Manager permissions
  INSERT INTO public.permissions (company_id, role, permission_key)
  VALUES 
    (p_company_id, 'manager'::app_role, 'dashboard'),
    (p_company_id, 'manager'::app_role, 'manager-dashboard'),
    (p_company_id, 'manager'::app_role, 'team'),
    (p_company_id, 'manager'::app_role, 'verifications-control'),
    (p_company_id, 'manager'::app_role, 'reports'),
    (p_company_id, 'manager'::app_role, 'salary'),
    (p_company_id, 'manager'::app_role, 'work-time-control'),
    (p_company_id, 'manager'::app_role, 'leave-requests');
  
  -- Employee permissions
  INSERT INTO public.permissions (company_id, role, permission_key)
  VALUES 
    (p_company_id, 'employee'::app_role, 'dashboard'),
    (p_company_id, 'employee'::app_role, 'attendance'),
    (p_company_id, 'employee'::app_role, 'salary'),
    (p_company_id, 'employee'::app_role, 'profile'),
    (p_company_id, 'employee'::app_role, 'work-session'),
    (p_company_id, 'employee'::app_role, 'verification');
END;
$$ LANGUAGE plpgsql;


-- STEP 5: Seed default permissions for all existing companies
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN SELECT id FROM public.companies LOOP
    PERFORM seed_default_permissions(company_record.id);
  END LOOP;
END $$;


-- STEP 6: Assign 'unassigned' role to users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'unassigned'::app_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;


-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check user roles
SELECT u.email, ur.role 
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LIMIT 10;

-- Check permissions for first company
SELECT r.role, array_agg(r.permission_key) as permissions
FROM public.permissions r
WHERE company_id = (SELECT id FROM public.companies LIMIT 1)
GROUP BY r.role;
