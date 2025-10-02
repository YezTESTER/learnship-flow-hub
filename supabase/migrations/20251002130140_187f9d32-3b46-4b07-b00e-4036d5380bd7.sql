-- Fix the check_missing_documents function to use correct enum values
CREATE OR REPLACE FUNCTION public.check_missing_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  learner_record RECORD;
  admin_id UUID;
  missing_docs TEXT[];
  required_docs TEXT[] := ARRAY['certified_id', 'cv_upload', 'proof_bank_account'];
  doc_type TEXT;
BEGIN
  -- Check each learner for missing documents
  FOR learner_record IN 
    SELECT id, full_name, created_at 
    FROM public.profiles 
    WHERE role = 'learner' 
      AND created_at > NOW() - INTERVAL '30 days' -- Only check learners from last 30 days
  LOOP
    missing_docs := ARRAY[]::TEXT[];
    
    -- Check for each required document type
    FOREACH doc_type IN ARRAY required_docs LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.documents 
        WHERE learner_id = learner_record.id 
          AND document_type = doc_type::document_type
      ) THEN
        missing_docs := array_append(missing_docs, doc_type);
      END IF;
    END LOOP;
    
    -- If there are missing documents, notify admins
    IF array_length(missing_docs, 1) > 0 THEN
      FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        PERFORM public.create_notification(
          admin_id,
          'Missing Documents Alert',
          learner_record.full_name || ' is missing required documents: ' || array_to_string(missing_docs, ', '),
          'warning'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$function$;