-- =====================================================
-- Enhanced User Trigger for CEO Company Creation
-- Run this AFTER 01_schema.sql and 02_storage.sql
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Enhanced trigger function that handles company creation for CEO signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
  v_company_id UUID;
  v_company_name TEXT;
  v_company_size TEXT;
  v_industry TEXT;
  v_company_address TEXT;
  v_company_website TEXT;
  v_company_role TEXT;
BEGIN
  -- Get account type from metadata
  v_account_type := NEW.raw_user_meta_data ->> 'account_type';
  
  IF v_account_type = 'company' THEN
    -- CEO signup - create company first
    v_company_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'My Company');
    v_company_size := NEW.raw_user_meta_data ->> 'company_size';
    v_industry := NEW.raw_user_meta_data ->> 'industry';
    v_company_address := NEW.raw_user_meta_data ->> 'company_address';
    v_company_website := NEW.raw_user_meta_data ->> 'company_website';
    v_company_role := COALESCE(NEW.raw_user_meta_data ->> 'company_role', 'CEO / Founder');
    
    -- Create the company
    INSERT INTO public.companies (name, timezone)
    VALUES (v_company_name, 'UTC')
    RETURNING id INTO v_company_id;
    
    -- Create the user linked to company
    INSERT INTO public.users (id, email, full_name, company_id, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      v_company_id,
      true
    );
    
    -- Assign CEO role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ceo');
    
    -- Create default permissions for all roles in this company
    -- Keys match UI permission IDs in PermissionsContext.tsx
    INSERT INTO public.permissions (company_id, role, permission_key)
    VALUES
      -- CEO permissions (all access)
      (v_company_id, 'ceo', 'all'),
      -- Admin permissions
      (v_company_id, 'admin', 'dashboard'),
      (v_company_id, 'admin', 'manager-dashboard'),
      (v_company_id, 'admin', 'team'),
      (v_company_id, 'admin', 'verifications-control'),
      (v_company_id, 'admin', 'reports'),
      (v_company_id, 'admin', 'company-settings'),
      (v_company_id, 'admin', 'salary-config'),
      (v_company_id, 'admin', 'staff-requests'),
      (v_company_id, 'admin', 'salary'),
      (v_company_id, 'admin', 'work-time-control'),
      (v_company_id, 'admin', 'leave-requests'),
      (v_company_id, 'admin', 'announcements'),
      -- Manager permissions
      (v_company_id, 'manager', 'dashboard'),
      (v_company_id, 'manager', 'manager-dashboard'),
      (v_company_id, 'manager', 'team'),
      (v_company_id, 'manager', 'verifications-control'),
      (v_company_id, 'manager', 'reports'),
      (v_company_id, 'manager', 'salary'),
      (v_company_id, 'manager', 'work-time-control'),
      (v_company_id, 'manager', 'leave-requests'),
      -- Employee permissions
      (v_company_id, 'employee', 'dashboard'),
      (v_company_id, 'employee', 'attendance'),
      (v_company_id, 'employee', 'salary'),
      (v_company_id, 'employee', 'profile'),
      (v_company_id, 'employee', 'work-session'),
      (v_company_id, 'employee', 'verification');
      
  ELSE
    -- Employee signup - just create user without company
    INSERT INTO public.users (id, email, full_name, company_id, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      NULL,
      false
    );
    
    -- Note: Employee role will be assigned when they join a company
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Add company_code column for employee joining
-- =====================================================

-- Add company_code to companies table for employees to join
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS company_code TEXT UNIQUE;

-- Function to generate unique company code
CREATE OR REPLACE FUNCTION public.generate_company_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code like "ACME-7X3K"
    v_code := UPPER(SUBSTRING(REPLACE(NEW.name, ' ', ''), 1, 4)) || '-' || 
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE company_code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      NEW.company_code := v_code;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate company code
DROP TRIGGER IF EXISTS generate_company_code_trigger ON public.companies;
CREATE TRIGGER generate_company_code_trigger
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  WHEN (NEW.company_code IS NULL)
  EXECUTE FUNCTION public.generate_company_code();

-- Update existing companies without codes
UPDATE public.companies 
SET company_code = UPPER(SUBSTRING(REPLACE(name, ' ', ''), 1, 4)) || '-' || 
                   UPPER(SUBSTRING(MD5(id::TEXT), 1, 4))
WHERE company_code IS NULL;

-- =====================================================
-- Function for employee to apply to company
-- =====================================================

CREATE OR REPLACE FUNCTION public.apply_to_company(
  p_company_code TEXT,
  p_department TEXT DEFAULT NULL,
  p_position TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_user_id UUID;
  v_existing_application UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Find company by code
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE company_code = UPPER(p_company_code);
  
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid company code');
  END IF;
  
  -- Check if user already has pending application
  SELECT id INTO v_existing_application
  FROM public.company_applications
  WHERE user_id = v_user_id AND company_id = v_company_id AND status = 'pending';
  
  IF v_existing_application IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have a pending application');
  END IF;
  
  -- Create application
  INSERT INTO public.company_applications (user_id, company_id, department, position, message, status)
  VALUES (v_user_id, v_company_id, p_department, p_position, p_message, 'pending');
  
  RETURN jsonb_build_object('success', true, 'message', 'Application submitted successfully');
END;
$$;

-- =====================================================
-- Function to approve/reject employee application
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_application(
  p_application_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_role public.app_role DEFAULT 'employee'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_application RECORD;
  v_company_id UUID;
BEGIN
  -- Get application details
  SELECT * INTO v_application
  FROM public.company_applications
  WHERE id = p_application_id;
  
  IF v_application IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;
  
  -- Verify caller is manager or above in the same company
  v_company_id := public.get_user_company_id(auth.uid());
  
  IF v_company_id != v_application.company_id OR NOT public.is_manager_or_above(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  IF p_action = 'approve' THEN
    -- Update application status
    UPDATE public.company_applications
    SET status = 'approved', processed_at = NOW(), processed_by = auth.uid()
    WHERE id = p_application_id;
    
    -- Update user's company and activate
    UPDATE public.users
    SET company_id = v_application.company_id, is_active = true
    WHERE id = v_application.user_id;
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_application.user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'message', 'Application approved');
    
  ELSIF p_action = 'reject' THEN
    UPDATE public.company_applications
    SET status = 'rejected', processed_at = NOW(), processed_by = auth.uid()
    WHERE id = p_application_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Application rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;
