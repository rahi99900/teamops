-- Add columns for Work Time Control features
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS break_end_time TIME DEFAULT '13:00:00',
ADD COLUMN IF NOT EXISTS current_work_status TEXT DEFAULT 'idle' CHECK (current_work_status IN ('idle', 'working', 'break', 'ended')),
ADD COLUMN IF NOT EXISTS active_break_reason TEXT;

-- Update existing rows to have default values
UPDATE public.companies 
SET current_work_status = 'idle' 
WHERE current_work_status IS NULL;
