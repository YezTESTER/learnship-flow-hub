-- Fix the unterminated dollar-quoted string in update_compliance_score function
CREATE OR REPLACE FUNCTION public.update_compliance_score(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  total_submissions INTEGER;
  on_time_submissions INTEGER;
  new_score DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO total_submissions
  FROM public.feedback_submissions
  WHERE learner_id = user_id;
  
  SELECT COUNT(*) INTO on_time_submissions
  FROM public.feedback_submissions
  WHERE learner_id = user_id 
  AND status IN ('submitted', 'approved')
  AND submitted_at <= due_date;
  
  IF total_submissions > 0 THEN
    new_score := (on_time_submissions::DECIMAL / total_submissions::DECIMAL) * 100;
  ELSE
    new_score := 100.00;
  END IF;
  
  UPDATE public.profiles
  SET compliance_score = new_score,
      updated_at = NOW()
  WHERE id = user_id;
END;
$function$