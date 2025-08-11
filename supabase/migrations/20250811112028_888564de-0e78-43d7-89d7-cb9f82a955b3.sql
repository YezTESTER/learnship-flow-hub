-- Harden functions by pinning search_path and schema-qualifying

-- 1) notify_admin_feedback_submission
CREATE OR REPLACE FUNCTION public.notify_admin_feedback_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  admin_id UUID;
  learner_name TEXT;
BEGIN
  -- Get learner name
  SELECT full_name INTO learner_name FROM public.profiles WHERE id = NEW.learner_id;
  
  -- Get all admin users
  FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
    PERFORM public.create_notification(
      admin_id,
      'New Feedback Submission',
      learner_name || ' has submitted their monthly feedback for ' || 
      to_char(make_date(NEW.year, NEW.month, 1), 'Month YYYY'),
      'info'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- 2) notify_admin_new_learner
CREATE OR REPLACE FUNCTION public.notify_admin_new_learner()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  admin_id UUID;
BEGIN
  -- Only notify for learner accounts
  IF NEW.role = 'learner' THEN
    -- Get all admin users
    FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
      PERFORM public.create_notification(
        admin_id,
        'New Learner Registered',
        NEW.full_name || ' has created a new learner account and requires review',
        'info'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3) notify_admin_document_upload
CREATE OR REPLACE FUNCTION public.notify_admin_document_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  admin_id UUID;
  learner_name TEXT;
BEGIN
  -- Get learner name
  SELECT full_name INTO learner_name FROM public.profiles WHERE id = NEW.learner_id;
  
  -- Get all admin users
  FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
    PERFORM public.create_notification(
      admin_id,
      'Document Uploaded',
      learner_name || ' has uploaded a new ' || NEW.document_type || ' document',
      'info'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- 4) check_missing_documents (SECURITY DEFINER retained)
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
  required_docs TEXT[] := ARRAY['id_document', 'cv', 'bank_letter'];
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

-- 5) notify_admin_message_read
CREATE OR REPLACE FUNCTION public.notify_admin_message_read()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  admin_id UUID;
  learner_name TEXT;
BEGIN
  -- Only trigger if read_at was NULL and is now not NULL (message was read)
  IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
    -- Check if this is a message from admin to learner
    IF NEW.message_type = 'admin_to_learner' THEN
      -- Get learner name
      SELECT full_name INTO learner_name FROM public.profiles WHERE id = NEW.user_id;
      
      -- Get the admin who sent the message (if available)
      IF NEW.sender_id IS NOT NULL THEN
        PERFORM public.create_notification(
          NEW.sender_id,
          'Message Read',
          learner_name || ' has read your message: "' || LEFT(NEW.title, 50) || '"',
          'success'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6) handle_new_user (SECURITY DEFINER retained)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
RETURN NEW;
END;
$function$;

-- 7) update_user_points (SECURITY DEFINER retained)
CREATE OR REPLACE FUNCTION public.update_user_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.profiles 
  SET points = COALESCE(points, 0) + NEW.points_awarded,
      updated_at = NOW()
  WHERE id = NEW.learner_id;
  RETURN NEW;
END;
$function$;

-- 8) update_cvs_updated_at
CREATE OR REPLACE FUNCTION public.update_cvs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 9) get_current_user_role (SQL function; keep STABLE & SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- 10) update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 11) check_overdue_submissions (SECURITY DEFINER retained)
CREATE OR REPLACE FUNCTION public.check_overdue_submissions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  overdue_record RECORD;
BEGIN
  -- Update overdue submissions
  UPDATE public.feedback_submissions 
  SET status = 'overdue'
  WHERE due_date < NOW() 
    AND status = 'pending'
    AND submitted_at IS NULL;
    
  -- Create notifications for overdue submissions
  FOR overdue_record IN 
    SELECT fs.learner_id, fs.month, fs.year, p.full_name
    FROM public.feedback_submissions fs
    JOIN public.profiles p ON p.id = fs.learner_id
    WHERE fs.status = 'overdue' 
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.user_id = fs.learner_id 
          AND n.title LIKE '%Overdue%'
          AND n.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    PERFORM public.create_notification(
      overdue_record.learner_id,
      'Monthly Report Overdue',
      'Your monthly report for ' || 
      to_char(make_date(overdue_record.year, overdue_record.month, 1), 'Month YYYY') || 
      ' is overdue. Please submit it as soon as possible.',
      'warning'
    );
  END LOOP;
END;
$function$;

-- 12) create_notification (SECURITY DEFINER retained)
CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_title text, notification_message text, notification_type text DEFAULT 'info'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;
