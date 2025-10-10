-- Step 1: Create a new, dedicated table for timesheet submissions
CREATE TABLE public.timesheet_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.timesheet_schedules(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(schedule_id) -- Ensures only one submission per schedule period
);

-- Step 2: Add RLS policies for the new table
ALTER TABLE public.timesheet_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners can manage their own timesheet submissions"
ON public.timesheet_submissions
FOR ALL
USING (learner_id = auth.uid());

CREATE POLICY "Admins can manage all timesheet submissions"
ON public.timesheet_submissions
FOR ALL
USING (get_current_user_role() = 'admin');

-- Step 3: Remove the old, problematic column from timesheet_schedules
ALTER TABLE public.timesheet_schedules
DROP COLUMN IF EXISTS work_timesheet_document_id;

-- Step 4: Add an index for performance
CREATE INDEX idx_timesheet_submissions_learner_schedule
ON public.timesheet_submissions(learner_id, schedule_id);

-- Note: This migration does not transfer old data. 
-- The previous `work_timesheet_document_id` was unreliable.
-- This change establishes a clean, new system going forward.