-- Create table for mentor visibility settings
CREATE TABLE IF NOT EXISTS public.mentor_visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visibility_mode TEXT DEFAULT 'assigned_only' CHECK (visibility_mode IN ('all', 'assigned_only', 'custom')),
  custom_learner_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentor_id)
);

-- Enable Row Level Security
ALTER TABLE public.mentor_visibility_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage mentor visibility settings" ON public.mentor_visibility_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Mentors can view their own visibility settings" ON public.mentor_visibility_settings
  FOR SELECT USING (mentor_id = auth.uid());

-- Create function to get visible learners for a mentor
CREATE OR REPLACE FUNCTION public.get_visible_learners_for_mentor(mentor_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role user_role,
  id_number TEXT,
  learnership_program TEXT,
  employer_name TEXT,
  mentor_id UUID,
  points INTEGER,
  compliance_score DECIMAL(5,2),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  visibility_mode TEXT;
  custom_learner_ids UUID[];
BEGIN
  -- Get the mentor's visibility settings
  SELECT mvs.visibility_mode, mvs.custom_learner_ids
  INTO visibility_mode, custom_learner_ids
  FROM public.mentor_visibility_settings mvs
  WHERE mvs.mentor_id = mentor_uuid;
  
  -- If no settings exist, default to assigned_only
  IF visibility_mode IS NULL THEN
    visibility_mode := 'assigned_only';
  END IF;
  
  -- Return learners based on visibility mode
  IF visibility_mode = 'all' THEN
    -- Return all learners
    RETURN QUERY
    SELECT p.* FROM public.profiles p WHERE p.role = 'learner';
  ELSIF visibility_mode = 'custom' THEN
    -- Return only custom selected learners
    RETURN QUERY
    SELECT p.* FROM public.profiles p 
    WHERE p.role = 'learner' AND p.id = ANY(custom_learner_ids);
  ELSE
    -- Default: return only assigned learners
    RETURN QUERY
    SELECT p.* FROM public.profiles p 
    WHERE p.role = 'learner' AND p.mentor_id = mentor_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to initialize default settings for a mentor
CREATE OR REPLACE FUNCTION public.initialize_mentor_visibility_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create settings for mentors
  IF NEW.role = 'mentor' THEN
    INSERT INTO public.mentor_visibility_settings (mentor_id)
    VALUES (NEW.id)
    ON CONFLICT (mentor_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create visibility settings when a mentor is created
CREATE TRIGGER on_mentor_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_mentor_visibility_settings();