-- Create function to award bonus points for perfect attendance
CREATE OR REPLACE FUNCTION public.award_perfect_attendance_bonus(learner_id UUID, schedule_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  absent_days_var INTEGER;
  already_awarded BOOLEAN := FALSE;
BEGIN
  -- Get the absent_days for this submission
  SELECT absent_days INTO absent_days_var
  FROM public.timesheet_submissions
  WHERE schedule_id = schedule_id;
  
  -- Check if this learner already received the perfect attendance bonus for this specific schedule
  SELECT EXISTS (
    SELECT 1 
    FROM public.achievements 
    WHERE learner_id = learner_id
    AND badge_name = 'Perfect Attendance'
    AND description LIKE '%schedule_id: ' || schedule_id || '%'
  ) INTO already_awarded;
  
  -- If absent days is 0 and bonus hasn't been awarded yet, award the bonus
  IF absent_days_var = 0 AND NOT already_awarded THEN
    INSERT INTO public.achievements (
      learner_id,
      badge_type,
      badge_name,
      description,
      points_awarded,
      badge_color,
      badge_icon
    ) VALUES (
      learner_id,
      'document_upload',
      'Perfect Attendance',
      'Uploaded timesheet with 0 absent days (schedule_id: ' || schedule_id || ')',
      10,
      '#10B981',
      'star'
    );
    
    -- Also create a notification
    PERFORM public.create_notification(
      learner_id,
      'Perfect Attendance Bonus!',
      'Great job! You earned 10 bonus points for submitting a timesheet with perfect attendance.',
      'success'
    );
  END IF;
END;
$$;