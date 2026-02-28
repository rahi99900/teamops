-- =====================================================
-- TeamOps Default Permissions Setup
-- Run this AFTER creating a company
-- =====================================================

-- This is a template for inserting default permissions for a new company
-- Replace 'YOUR_COMPANY_ID' with the actual company UUID

-- CEO permissions (all access)
-- INSERT INTO public.permissions (company_id, role, permission_key) VALUES
-- ('YOUR_COMPANY_ID', 'ceo', 'all');

-- Admin permissions
-- INSERT INTO public.permissions (company_id, role, permission_key) VALUES
-- ('YOUR_COMPANY_ID', 'admin', 'dashboard'),
-- ('YOUR_COMPANY_ID', 'admin', 'manager-dashboard'),
-- ('YOUR_COMPANY_ID', 'admin', 'team'),
-- ('YOUR_COMPANY_ID', 'admin', 'verifications-control'),
-- ('YOUR_COMPANY_ID', 'admin', 'reports'),
-- ('YOUR_COMPANY_ID', 'admin', 'company-settings'),
-- ('YOUR_COMPANY_ID', 'admin', 'salary-config'),
-- ('YOUR_COMPANY_ID', 'admin', 'staff-requests'),
-- ('YOUR_COMPANY_ID', 'admin', 'work-time-control'),
-- ('YOUR_COMPANY_ID', 'admin', 'leave-requests'),
-- ('YOUR_COMPANY_ID', 'admin', 'announcements');

-- Manager permissions
-- INSERT INTO public.permissions (company_id, role, permission_key) VALUES
-- ('YOUR_COMPANY_ID', 'manager', 'dashboard'),
-- ('YOUR_COMPANY_ID', 'manager', 'manager-dashboard'),
-- ('YOUR_COMPANY_ID', 'manager', 'team'),
-- ('YOUR_COMPANY_ID', 'manager', 'verifications-control'),
-- ('YOUR_COMPANY_ID', 'manager', 'reports'),
-- ('YOUR_COMPANY_ID', 'manager', 'work-time-control'),
-- ('YOUR_COMPANY_ID', 'manager', 'leave-requests');

-- Employee permissions
-- INSERT INTO public.permissions (company_id, role, permission_key) VALUES
-- ('YOUR_COMPANY_ID', 'employee', 'dashboard'),
-- ('YOUR_COMPANY_ID', 'employee', 'attendance'),
-- ('YOUR_COMPANY_ID', 'employee', 'salary'),
-- ('YOUR_COMPANY_ID', 'employee', 'profile'),
-- ('YOUR_COMPANY_ID', 'employee', 'work-session'),
-- ('YOUR_COMPANY_ID', 'employee', 'verification');
