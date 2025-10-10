-- Add a column to link timesheet schedules directly to a document
ALTER TABLE public.timesheet_schedules
ADD COLUMN IF NOT EXISTS work_timesheet_document_id UUID
REFERENCES public.documents(id) ON DELETE SET NULL;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_timesheet_schedules_work_doc_id
ON public.timesheet_schedules(work_timesheet_document_id);