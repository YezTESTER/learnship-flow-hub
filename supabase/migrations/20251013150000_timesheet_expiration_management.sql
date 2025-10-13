-- Add expiration_date column to timesheet_submissions table
ALTER TABLE public.timesheet_submissions
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;

-- Add download_count column to track how many times admin has downloaded the timesheet
ALTER TABLE public.timesheet_submissions
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Add is_expired flag to mark expired timesheets
ALTER TABLE public.timesheet_submissions
ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE;

-- Add a function to set expiration date when a timesheet is submitted
CREATE OR REPLACE FUNCTION public.set_timesheet_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set expiration date to 2 months from upload date
  NEW.expiration_date := NEW.uploaded_at + INTERVAL '2 months';
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set expiration date on insert
DROP TRIGGER IF EXISTS set_timesheet_expiration_trigger ON public.timesheet_submissions;
CREATE TRIGGER set_timesheet_expiration_trigger
  BEFORE INSERT ON public.timesheet_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timesheet_expiration();

-- Create function to increment download count when admin downloads a timesheet
CREATE OR REPLACE FUNCTION public.increment_timesheet_download(schedule_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.timesheet_submissions
  SET download_count = download_count + 1
  WHERE schedule_id = schedule_id;
END;
$$;

-- Create function to check and mark expired timesheets
CREATE OR REPLACE FUNCTION public.check_and_mark_expired_timesheets()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark timesheets as expired if their expiration date has passed
  UPDATE public.timesheet_submissions
  SET is_expired = TRUE
  WHERE expiration_date <= NOW() AND is_expired = FALSE;
END;
$$;

-- Create function to delete expired timesheet files from storage
-- Note: This function would typically be called by a cron job or background process
CREATE OR REPLACE FUNCTION public.delete_expired_timesheet_files()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted INTEGER := 0;
  file_path TEXT;
  schedule_id UUID;
BEGIN
  -- Get expired timesheets that haven't been processed yet
  FOR schedule_id, file_path IN 
    SELECT ts.schedule_id, ts.file_path
    FROM public.timesheet_submissions ts
    WHERE ts.is_expired = TRUE 
      AND ts.file_path IS NOT NULL
      AND ts.file_path != ''
  LOOP
    -- In a real implementation, we would delete the file from storage here
    -- For now, we'll just mark it as processed by setting file_path to NULL
    -- In practice, you would use supabase.storage.from('office-documents').remove([file_path])
    
    UPDATE public.timesheet_submissions
    SET file_path = NULL
    WHERE schedule_id = schedule_id;
    
    deleted := deleted + 1;
  END LOOP;
  
  RETURN QUERY SELECT deleted;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_expiration 
ON public.timesheet_submissions(expiration_date, is_expired);

CREATE INDEX IF NOT EXISTS idx_timesheet_submissions_download_count 
ON public.timesheet_submissions(download_count);