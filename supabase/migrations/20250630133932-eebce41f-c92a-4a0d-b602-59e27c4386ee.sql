
-- Update profiles table to better support the learnership management system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update RLS policies for profiles to allow mentors to view their assigned learners
DROP POLICY IF EXISTS "Mentors can view their learners" ON public.profiles;
CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update feedback_submissions to include mentor approval workflow
ALTER TABLE public.feedback_submissions 
ADD COLUMN IF NOT EXISTS needs_mentor_review BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mentor_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mentor_comments TEXT;

-- Update RLS policies for feedback_submissions
DROP POLICY IF EXISTS "Learners can manage own submissions" ON public.feedback_submissions;
CREATE POLICY "Learners can manage own submissions" ON public.feedback_submissions
  FOR ALL USING (
    learner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND 
      (p.role = 'admin' OR p.id = (SELECT mentor_id FROM public.profiles WHERE id = feedback_submissions.learner_id))
    )
  );

-- Update RLS policies for documents
DROP POLICY IF EXISTS "Users can manage relevant documents" ON public.documents;
CREATE POLICY "Users can manage relevant documents" ON public.documents
  FOR ALL USING (
    learner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND 
      (p.role = 'admin' OR p.id = (SELECT mentor_id FROM public.profiles WHERE id = documents.learner_id))
    )
  );

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view relevant documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND 
        (p.role = 'admin' OR p.id = (SELECT mentor_id FROM public.profiles WHERE id = (storage.foldername(name))[1]::uuid))
      )
    )
  );

-- Update achievements table to support more badge types
ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS badge_icon TEXT DEFAULT 'award';

-- Function to automatically assign points when achievements are earned
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET points = COALESCE(points, 0) + NEW.points_awarded,
      updated_at = NOW()
  WHERE id = NEW.learner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update points when achievements are created
DROP TRIGGER IF EXISTS on_achievement_created ON public.achievements;
CREATE TRIGGER on_achievement_created
  AFTER INSERT ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overdue submissions and create notifications
CREATE OR REPLACE FUNCTION public.check_overdue_submissions()
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
