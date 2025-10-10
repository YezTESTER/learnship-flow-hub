-- Create comprehensive compliance system with bi-weekly timesheets

-- 1. Create compliance factors table to track individual components
CREATE TABLE public.compliance_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  feedback_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100% (40% weight)
  timesheet_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100% (35% weight)
  document_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100% (15% weight)
  engagement_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100% (10% weight)
  overall_score DECIMAL(5,2) DEFAULT 0.00, -- Weighted average
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(learner_id, month, year)
);

-- 2. Create bi-weekly timesheet schedules table
CREATE TABLE public.timesheet_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  period INTEGER NOT NULL, -- 1 or 2 (first half or second half of month)
  work_timesheet_uploaded BOOLEAN DEFAULT FALSE,
  class_timesheet_uploaded BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(learner_id, month, year, period)
);

-- 3. Create performance metrics table for historical tracking
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'monthly_compliance', 'streak', 'improvement'
  metric_value DECIMAL(10,2) NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Add RLS policies
ALTER TABLE public.compliance_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Learners can view their own data
CREATE POLICY "Users can view own compliance factors" ON public.compliance_factors
FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Users can view own timesheet schedules" ON public.timesheet_schedules
FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
FOR SELECT USING (learner_id = auth.uid());

-- Admins can manage all data
CREATE POLICY "Admins can manage all compliance factors" ON public.compliance_factors
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage all timesheet schedules" ON public.timesheet_schedules
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage all performance metrics" ON public.performance_metrics
FOR ALL USING (get_current_user_role() = 'admin');

-- 5. Create updated compliance calculation function
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_compliance(user_id UUID, target_month INTEGER, target_year INTEGER)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  feedback_score DECIMAL(5,2) := 0.00;
  timesheet_score DECIMAL(5,2) := 0.00;
  document_score DECIMAL(5,2) := 0.00;
  engagement_score DECIMAL(5,2) := 0.00;
  overall_score DECIMAL(5,2) := 0.00;
  required_docs INTEGER := 3; -- id_document, cv, bank_letter
  uploaded_docs INTEGER := 0;
  profile_completion DECIMAL(5,2) := 0.00;
BEGIN
  -- 1. Calculate feedback score (40% weight)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.00
      WHEN COUNT(*) FILTER (WHERE status IN ('submitted', 'approved') AND submitted_at <= due_date) = 0 THEN 0.00
      ELSE (COUNT(*) FILTER (WHERE status IN ('submitted', 'approved') AND submitted_at <= due_date)::DECIMAL / COUNT(*)::DECIMAL) * 100
    END
  INTO feedback_score
  FROM public.feedback_submissions
  WHERE learner_id = user_id 
    AND month = target_month 
    AND year = target_year;

  -- 2. Calculate timesheet score (35% weight) - now bi-weekly (2 periods per month)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0.00
      ELSE (COUNT(*) FILTER (WHERE work_timesheet_uploaded = TRUE AND class_timesheet_uploaded = TRUE)::DECIMAL / 2.00) * 100
    END
  INTO timesheet_score
  FROM public.timesheet_schedules
  WHERE learner_id = user_id 
    AND month = target_month 
    AND year = target_year;

  -- 3. Calculate document score (15% weight)
  SELECT COUNT(DISTINCT document_type) INTO uploaded_docs
  FROM public.documents
  WHERE learner_id = user_id 
    AND document_type IN ('id_document', 'cv', 'bank_letter');
  
  document_score := (uploaded_docs::DECIMAL / required_docs::DECIMAL) * 100;

  -- 4. Calculate engagement score (10% weight)
  -- Profile completion (50% of engagement)
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

  -- Recent achievements (50% of engagement)
  engagement_score := (profile_completion * 0.5) + 
    (CASE 
      WHEN (SELECT COUNT(*) FROM public.achievements WHERE learner_id = user_id AND earned_at >= make_date(target_year, target_month, 1)) > 0 
      THEN 50.00 
      ELSE 0.00 
    END);

  -- 5. Calculate weighted overall score
  overall_score := (feedback_score * 0.40) + (timesheet_score * 0.35) + (document_score * 0.15) + (engagement_score * 0.10);

  -- 6. Store in compliance_factors table
  INSERT INTO public.compliance_factors (
    learner_id, month, year, feedback_score, timesheet_score, 
    document_score, engagement_score, overall_score
  )
  VALUES (
    user_id, target_month, target_year, feedback_score, timesheet_score,
    document_score, engagement_score, overall_score
  )
  ON CONFLICT (learner_id, month, year) 
  DO UPDATE SET
    feedback_score = EXCLUDED.feedback_score,
    timesheet_score = EXCLUDED.timesheet_score,
    document_score = EXCLUDED.document_score,
    engagement_score = EXCLUDED.engagement_score,
    overall_score = EXCLUDED.overall_score,
    updated_at = now();

  RETURN overall_score;
END;
$$;

-- 6. Create function to initialize bi-weekly timesheet schedules
CREATE OR REPLACE FUNCTION public.initialize_biweekly_timesheets(user_id UUID, target_month INTEGER, target_year INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_1_due DATE;
  period_2_due DATE;
  existing_count INTEGER;
BEGIN
  -- Check if schedules for this month already exist
  SELECT COUNT(*) INTO existing_count
  FROM public.timesheet_schedules
  WHERE learner_id = user_id AND month = target_month AND year = target_year;

  IF existing_count > 0 THEN
    RETURN;
  END IF;

  -- Calculate due dates (15th and last day of month)
  period_1_due := make_date(target_year, target_month, 15);
  period_2_due := (make_date(target_year, target_month, 1) + INTERVAL '1 month - 1 day')::DATE;

  -- Insert bi-weekly periods
  INSERT INTO public.timesheet_schedules (learner_id, month, year, period, due_date)
  VALUES 
    (user_id, target_month, target_year, 1, period_1_due),
    (user_id, target_month, target_year, 2, period_2_due)
  ON CONFLICT (learner_id, month, year, period) DO NOTHING;
END;
$$;

-- 7. Create function to award performance-based points
CREATE OR REPLACE FUNCTION public.award_performance_points(user_id UUID, action_type TEXT, base_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  multiplier DECIMAL(3,2) := 1.00;
  bonus_points INTEGER := 0;
  final_points INTEGER;
  current_month INTEGER := EXTRACT(month FROM now());
  current_year INTEGER := EXTRACT(year FROM now());
  compliance_score DECIMAL(5,2);
BEGIN
  -- Get current compliance score
  SELECT overall_score INTO compliance_score
  FROM public.compliance_factors
  WHERE learner_id = user_id 
    AND month = current_month 
    AND year = current_year;

  -- Apply performance multipliers
  IF compliance_score >= 90 THEN
    multiplier := 1.25; -- 25% bonus for excellent performance
  ELSIF compliance_score >= 80 THEN
    multiplier := 1.15; -- 15% bonus for good performance
  ELSIF compliance_score < 60 THEN
    multiplier := 0.85; -- 15% penalty for poor performance
  END IF;

  -- Calculate streak bonuses
  IF action_type = 'feedback_submission' THEN
    -- Check for submission streak
    SELECT COUNT(*) INTO bonus_points
    FROM public.feedback_submissions
    WHERE learner_id = user_id 
      AND status IN ('submitted', 'approved')
      AND submitted_at <= due_date
      AND submitted_at >= now() - INTERVAL '3 months';
    
    IF bonus_points >= 3 THEN
      multiplier := multiplier + 0.10; -- Additional 10% for 3+ month streak
    END IF;
  END IF;

  final_points := (base_points * multiplier)::INTEGER;

  RETURN final_points;
END;
$$;

-- 8. Update the main compliance score update function
CREATE OR REPLACE FUNCTION public.update_compliance_score(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month INTEGER := EXTRACT(month FROM now());
  current_year INTEGER := EXTRACT(year FROM now());
  new_score DECIMAL(5,2);
BEGIN
  -- Initialize bi-weekly timesheets for current month
  PERFORM public.initialize_biweekly_timesheets(user_id, current_month, current_year);
  
  -- Calculate comprehensive compliance
  new_score := public.calculate_comprehensive_compliance(user_id, current_month, current_year);
  
  -- Update profile with new score
  UPDATE public.profiles
  SET compliance_score = new_score,
      updated_at = now()
  WHERE id = user_id;
END;
$$;

-- 9. Create trigger to update updated_at timestamp
CREATE TRIGGER update_compliance_factors_updated_at
  BEFORE UPDATE ON public.compliance_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create indexes for performance
CREATE INDEX idx_compliance_factors_learner_period ON public.compliance_factors(learner_id, year, month);
CREATE INDEX idx_timesheet_schedules_learner_period ON public.timesheet_schedules(learner_id, year, month, period);
CREATE INDEX idx_performance_metrics_learner_period ON public.performance_metrics(learner_id, period_year, period_month);