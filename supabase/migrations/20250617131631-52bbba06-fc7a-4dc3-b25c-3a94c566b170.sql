
-- Create enum types for roles and compliance statuses
CREATE TYPE public.user_role AS ENUM ('learner', 'mentor', 'admin');
CREATE TYPE public.compliance_status AS ENUM ('pending', 'submitted', 'overdue', 'approved', 'rejected');
CREATE TYPE public.document_type AS ENUM ('attendance_proof', 'logbook_page', 'assessment', 'other');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'learner',
  id_number TEXT,
  learnership_program TEXT,
  employer_name TEXT,
  mentor_id UUID REFERENCES public.profiles(id),
  points INTEGER DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0.00,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly feedback submissions table
CREATE TABLE public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status compliance_status DEFAULT 'pending',
  submission_data JSONB,
  mentor_feedback TEXT,
  mentor_rating INTEGER CHECK (mentor_rating >= 1 AND mentor_rating <= 5),
  submitted_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(learner_id, month, year)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES public.feedback_submissions(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements/badges table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  points_awarded INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for feedback submissions
CREATE POLICY "Learners can manage own submissions" ON public.feedback_submissions
  FOR ALL USING (
    learner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND 
      (p.role = 'admin' OR p.id = (SELECT mentor_id FROM public.profiles WHERE id = feedback_submissions.learner_id))
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can manage relevant documents" ON public.documents
  FOR ALL USING (
    learner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND 
      (p.role = 'admin' OR p.id = (SELECT mentor_id FROM public.profiles WHERE id = documents.learner_id))
    )
  );

-- RLS Policies for achievements
CREATE POLICY "Users can view achievements" ON public.achievements
  FOR SELECT USING (
    learner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND 
      (p.role = 'admin' OR p.id = (SELECT mentor_id FROM public.profiles WHERE id = achievements.learner_id))
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'learner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update compliance score
CREATE OR REPLACE FUNCTION public.update_compliance_score(user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_submissions INTEGER;
  on_time_submissions INTEGER;
  new_score DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO total_submissions
  FROM public.feedback_submissions
  WHERE learner_id = user_id;
  
  SELECT COUNT(*) INTO on_time_submissions
  FROM public.feedback_submissions
  WHERE learner_id = user_id 
  AND status IN ('submitted', 'approved')
  AND submitted_at <= due_date;
  
  IF total_submissions > 0 THEN
    new_score := (on_time_submissions::DECIMAL / total_submissions::DECIMAL) * 100;
  ELSE
    new_score := 100.00;
  END IF;
  
  UPDATE public.profiles
  SET compliance_score = new_score,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
