-- Create monthly_compliance_history table to track monthly compliance scores
CREATE TABLE IF NOT EXISTS public.monthly_compliance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Monthly compliance percentage scores
  feedback_score DECIMAL(5,2) DEFAULT 0.00,
  timesheet_score DECIMAL(5,2) DEFAULT 0.00,
  document_score DECIMAL(5,2) DEFAULT 0.00,
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  overall_compliance_percent DECIMAL(5,2) DEFAULT 0.00,
  
  -- Monthly points earned
  feedback_points INTEGER DEFAULT 0,
  timesheet_points INTEGER DEFAULT 0,
  document_points INTEGER DEFAULT 0,
  engagement_points INTEGER DEFAULT 0,
  total_monthly_points INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(learner_id, month, year)
);

-- Create index for faster queries
CREATE INDEX idx_monthly_compliance_learner_date ON public.monthly_compliance_history(learner_id, year DESC, month DESC);

-- Enable RLS
ALTER TABLE public.monthly_compliance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own compliance history"
  ON public.monthly_compliance_history
  FOR SELECT
  USING (learner_id = auth.uid());

CREATE POLICY "Admins can manage all compliance history"
  ON public.monthly_compliance_history
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- Create function to calculate and store monthly compliance
CREATE OR REPLACE FUNCTION public.calculate_monthly_compliance_with_points(
  user_id UUID,
  target_month INTEGER,
  target_year INTEGER
)
RETURNS TABLE(
  compliance_percent DECIMAL(5,2),
  total_points INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  feedback_score DECIMAL(5,2) := 0.00;
  timesheet_score DECIMAL(5,2) := 0.00;
  document_score DECIMAL(5,2) := 0.00;
  engagement_score DECIMAL(5,2) := 0.00;
  overall_score DECIMAL(5,2) := 0.00;
  
  feedback_points INTEGER := 0;
  timesheet_points INTEGER := 0;
  document_points INTEGER := 0;
  engagement_points INTEGER := 0;
  total_points INTEGER := 0;
  
  required_docs INTEGER := 3;
  uploaded_docs INTEGER := 0;
  profile_completion DECIMAL(5,2) := 0.00;
BEGIN
  -- 1. Calculate feedback score (40% weight) and points
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.00
      WHEN COUNT(*) FILTER (WHERE status IN ('submitted', 'approved') AND submitted_at <= due_date) = 0 THEN 0.00
      ELSE (COUNT(*) FILTER (WHERE status IN ('submitted', 'approved') AND submitted_at <= due_date)::DECIMAL / COUNT(*)::DECIMAL) * 100
    END,
    COALESCE(COUNT(*) FILTER (WHERE status IN ('submitted', 'approved')) * 50, 0)
  INTO feedback_score, feedback_points
  FROM public.feedback_submissions
  WHERE learner_id = user_id 
    AND month = target_month 
    AND year = target_year;

  -- 2. Calculate timesheet score (35% weight) and points - bi-weekly (2 periods per month)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.00
      ELSE (COUNT(*) FILTER (WHERE work_timesheet_uploaded = TRUE)::DECIMAL / 2.00) * 100
    END,
    COALESCE(COUNT(*) FILTER (WHERE work_timesheet_uploaded = TRUE) * 30, 0)
  INTO timesheet_score, timesheet_points
  FROM public.timesheet_schedules
  WHERE learner_id = user_id 
    AND month = target_month 
    AND year = target_year;

  -- 3. Calculate document score (15% weight) and points
  SELECT COUNT(DISTINCT document_type) INTO uploaded_docs
  FROM public.documents
  WHERE learner_id = user_id 
    AND document_type IN ('id_document', 'cv', 'bank_letter');
  
  document_score := (uploaded_docs::DECIMAL / required_docs::DECIMAL) * 100;
  document_points := uploaded_docs * 20;

  -- 4. Calculate engagement score (10% weight) and points
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (
        (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN id_number IS NOT NULL AND id_number != '' THEN 1 ELSE 0 END) +
        (CASE WHEN learnership_program IS NOT NULL AND learnership_program != '' THEN 1 ELSE 0 END) +
        (CASE WHEN employer_name IS NOT NULL AND employer_name != '' THEN 1 ELSE 0 END) +
        (CASE WHEN phone_number IS NOT NULL AND phone_number != '' THEN 1 ELSE 0 END) +
        (CASE WHEN address IS NOT NULL AND address != '' THEN 1 ELSE 0 END) +
        (CASE WHEN date_of_birth IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN emergency_contact IS NOT NULL AND emergency_contact != '' THEN 1 ELSE 0 END) +
        (CASE WHEN emergency_phone IS NOT NULL AND emergency_phone != '' THEN 1 ELSE 0 END) +
        (CASE WHEN start_date IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN end_date IS NOT NULL THEN 1 ELSE 0 END)
      ) * 100 / 11
    END
  INTO profile_completion
  FROM public.profiles
  WHERE id = user_id;

  engagement_score := profile_completion;
  engagement_points := (profile_completion / 100 * 10)::INTEGER;

  -- 5. Calculate weighted overall score
  overall_score := (feedback_score * 0.40) + (timesheet_score * 0.35) + (document_score * 0.15) + (engagement_score * 0.10);
  total_points := feedback_points + timesheet_points + document_points + engagement_points;

  -- 6. Store in monthly_compliance_history table
  INSERT INTO public.monthly_compliance_history (
    learner_id, month, year, 
    feedback_score, timesheet_score, document_score, engagement_score, 
    overall_compliance_percent,
    feedback_points, timesheet_points, document_points, engagement_points,
    total_monthly_points
  )
  VALUES (
    user_id, target_month, target_year, 
    feedback_score, timesheet_score, document_score, engagement_score, 
    overall_score,
    feedback_points, timesheet_points, document_points, engagement_points,
    total_points
  )
  ON CONFLICT (learner_id, month, year) 
  DO UPDATE SET
    feedback_score = EXCLUDED.feedback_score,
    timesheet_score = EXCLUDED.timesheet_score,
    document_score = EXCLUDED.document_score,
    engagement_score = EXCLUDED.engagement_score,
    overall_compliance_percent = EXCLUDED.overall_compliance_percent,
    feedback_points = EXCLUDED.feedback_points,
    timesheet_points = EXCLUDED.timesheet_points,
    document_points = EXCLUDED.document_points,
    engagement_points = EXCLUDED.engagement_points,
    total_monthly_points = EXCLUDED.total_monthly_points,
    updated_at = NOW();

  RETURN QUERY SELECT overall_score, total_points;
END;
$$;