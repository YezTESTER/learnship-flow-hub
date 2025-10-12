-- Create trigger function to sync timesheet_schedules with timesheet_submissions
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

-- Create trigger to automatically update timesheet_schedules when a submission is made
DROP TRIGGER IF EXISTS sync_timesheet_schedule_on_submission ON public.timesheet_submissions;
CREATE TRIGGER sync_timesheet_schedule_on_submission
  AFTER INSERT OR UPDATE ON public.timesheet_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_timesheet_schedule_status();

-- Also create a function to manually sync all timesheet schedules for a learner
CREATE OR REPLACE FUNCTION public.sync_all_timesheet_schedules_for_learner(learner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all timesheet schedules for the learner based on existing submissions
  UPDATE public.timesheet_schedules ts
  SET work_timesheet_uploaded = TRUE,
      uploaded_at = (
        SELECT MAX(tsub.uploaded_at)
        FROM public.timesheet_submissions tsub
        WHERE tsub.schedule_id = ts.id
      ),
      updated_at = NOW()
  WHERE ts.learner_id = sync_all_timesheet_schedules_for_learner.learner_id
    AND EXISTS (
      SELECT 1
      FROM public.timesheet_submissions tsub
      WHERE tsub.schedule_id = ts.id
    );
  
  -- Update any schedules that don't have submissions to mark as not uploaded
  UPDATE public.timesheet_schedules ts
  SET work_timesheet_uploaded = FALSE,
      uploaded_at = NULL,
      updated_at = NOW()
  WHERE ts.learner_id = sync_all_timesheet_schedules_for_learner.learner_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.timesheet_submissions tsub
      WHERE tsub.schedule_id = ts.id
    );
END;
$$;