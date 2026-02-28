-- Add missing columns for Work Time Control configuration
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS lunch_start_time TIME DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS break_end_time TIME DEFAULT '13:00:00';
