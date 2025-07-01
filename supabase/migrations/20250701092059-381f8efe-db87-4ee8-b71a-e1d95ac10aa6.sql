
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view their learners" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Learners can manage own submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can manage own feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Users can manage relevant documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can manage all achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

-- Create a security definer function to get user role without causing recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create safe RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Create safe RLS policies for feedback_submissions
CREATE POLICY "Users can manage own feedback" ON public.feedback_submissions
  FOR ALL USING (learner_id = auth.uid());

CREATE POLICY "Admins can manage all feedback" ON public.feedback_submissions
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Create safe RLS policies for documents
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (learner_id = auth.uid());

CREATE POLICY "Admins can manage all documents" ON public.documents
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Create RLS policies for achievements
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Admins can manage all achievements" ON public.achievements
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (public.get_current_user_role() = 'admin');
