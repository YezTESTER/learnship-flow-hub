-- Create automatic notifications for admin when learners submit feedback
CREATE OR REPLACE FUNCTION notify_admin_feedback_submission()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for feedback submissions
CREATE TRIGGER trigger_admin_feedback_notification
  AFTER INSERT ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION notify_admin_feedback_submission();

-- Create automatic notifications for admin when new learners register
CREATE OR REPLACE FUNCTION notify_admin_new_learner()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for new learner registrations
CREATE TRIGGER trigger_admin_new_learner_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_learner();

-- Create automatic notifications for admin when learners upload documents
CREATE OR REPLACE FUNCTION notify_admin_document_upload()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for document uploads
CREATE TRIGGER trigger_admin_document_notification
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION notify_admin_document_upload();

-- Create function to check and notify about missing documents
CREATE OR REPLACE FUNCTION check_missing_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create function to notify when message read status changes
CREATE OR REPLACE FUNCTION notify_admin_message_read()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for message read notifications
CREATE TRIGGER trigger_admin_message_read_notification
  AFTER UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION notify_admin_message_read();