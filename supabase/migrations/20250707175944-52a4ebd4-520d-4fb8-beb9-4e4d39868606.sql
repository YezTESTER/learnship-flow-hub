-- Create learner categories table
CREATE TABLE public.learner_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on learner_categories
ALTER TABLE public.learner_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for learner_categories
CREATE POLICY "Admins can manage all categories" 
ON public.learner_categories 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create learner_category_assignments table
CREATE TABLE public.learner_category_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  category_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(learner_id, category_id)
);

-- Enable RLS on learner_category_assignments
ALTER TABLE public.learner_category_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for learner_category_assignments
CREATE POLICY "Admins can manage all assignments" 
ON public.learner_category_assignments 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Update notifications table to track read status better
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'system';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for learner_categories
CREATE TRIGGER update_learner_categories_updated_at
BEFORE UPDATE ON public.learner_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();