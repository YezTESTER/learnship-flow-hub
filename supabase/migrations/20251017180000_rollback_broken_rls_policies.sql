-- Rollback broken RLS policies and restore working state

-- Drop the problematic mentor visibility settings table and functions
DROP TABLE IF EXISTS public.mentor_visibility_settings CASCADE;
DROP FUNCTION IF EXISTS public.get_visible_learners_for_mentor(UUID);
DROP FUNCTION IF EXISTS public.initialize_mentor_visibility_settings();

-- Restore original RLS policies for profiles table
DROP POLICY IF EXISTS "Mentors can view their learners" ON public.profiles;
CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Restore original RLS policies for feedback_submissions table
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

-- Restore original RLS policies for documents table
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

-- Restore original storage policies
DROP POLICY IF EXISTS "Users can view relevant documents" ON storage.objects;
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