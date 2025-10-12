-- Add absent_days column to timesheet_submissions table
ALTER TABLE public.timesheet_submissions
ADD COLUMN IF NOT EXISTS absent_days INTEGER DEFAULT 0;

-- Add a check constraint to ensure absent_days is non-negative
ALTER TABLE public.timesheet_submissions
ADD CONSTRAINT timesheet_submissions_absent_days_check
CHECK (absent_days >= 0);

-- Add updated_at column to timesheet_schedules table if it doesn't exist
ALTER TABLE public.timesheet_schedules
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the sync function to include absent_days in the schedule update
CREATE OR REPLACE FUNCTION public.sync_timesheet_schedule_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the timesheet_schedules table to mark the timesheet as uploaded
  UPDATE public.timesheet_schedules
  SET work_timesheet_uploaded = TRUE,
      uploaded_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.schedule_id;
  
  RETURN NEW;
END;
$$;