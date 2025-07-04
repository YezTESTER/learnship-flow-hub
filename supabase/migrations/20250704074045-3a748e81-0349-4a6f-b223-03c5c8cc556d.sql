-- Create CVs table for learner CV management
CREATE TABLE public.cvs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  cv_name TEXT NOT NULL,
  personal_info JSONB,
  work_experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills TEXT[] DEFAULT '{}',
  additional_info TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

-- Create policies for CV access
CREATE POLICY "Users can view their own CVs" 
ON public.cvs 
FOR SELECT 
USING (auth.uid() = learner_id);

CREATE POLICY "Users can create their own CVs" 
ON public.cvs 
FOR INSERT 
WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Users can update their own CVs" 
ON public.cvs 
FOR UPDATE 
USING (auth.uid() = learner_id);

CREATE POLICY "Users can delete their own CVs" 
ON public.cvs 
FOR DELETE 
USING (auth.uid() = learner_id);

CREATE POLICY "Admins can manage all CVs" 
ON public.cvs 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cvs_updated_at
BEFORE UPDATE ON public.cvs
FOR EACH ROW
EXECUTE FUNCTION public.update_cvs_updated_at();

-- Create unique constraint on cv_name per learner
ALTER TABLE public.cvs ADD CONSTRAINT unique_cv_name_per_learner UNIQUE (learner_id, cv_name);