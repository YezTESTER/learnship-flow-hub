-- Create triggers for automatic notifications

-- 1. Trigger for feedback submissions
CREATE TRIGGER trigger_notify_admin_feedback_submission
    AFTER INSERT ON public.feedback_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_feedback_submission();

-- 2. Trigger for new learner registration
CREATE TRIGGER trigger_notify_admin_new_learner
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_new_learner();

-- 3. Trigger for document uploads
CREATE TRIGGER trigger_notify_admin_document_upload
    AFTER INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_document_upload();

-- 4. Trigger for message read notifications
CREATE TRIGGER trigger_notify_admin_message_read
    AFTER UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_message_read();

-- 5. Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;