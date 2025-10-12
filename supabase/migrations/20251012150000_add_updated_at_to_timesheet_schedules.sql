-- Add updated_at column to timesheet_schedules table
ALTER TABLE public.timesheet_schedules
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();