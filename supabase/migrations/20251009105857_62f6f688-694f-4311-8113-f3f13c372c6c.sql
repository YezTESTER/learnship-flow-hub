-- Add is_editable_by_learner field to feedback_submissions table
ALTER TABLE public.feedback_submissions
ADD COLUMN is_editable_by_learner BOOLEAN DEFAULT false;

-- Update existing records to be non-editable by default
UPDATE public.feedback_submissions
SET is_editable_by_learner = false
WHERE is_editable_by_learner IS NULL;