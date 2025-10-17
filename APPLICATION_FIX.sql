-- This is the fix for your application's database issues
-- Run this in your Supabase SQL editor

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view their learners" ON public.profiles;

-- Create the basic RLS policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy for mentors to view their assigned learners
CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create the bulk assignment function if it doesn't exist
CREATE OR REPLACE FUNCTION public.bulk_assign_learners_to_mentor(learner_uuids UUID[], mentor_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First unassign all learners from this mentor
  UPDATE public.profiles 
  SET mentor_id = NULL
  WHERE mentor_id = mentor_uuid AND role = 'learner';
  
  -- Then assign the specified learners to this mentor
  UPDATE public.profiles 
  SET mentor_id = mentor_uuid
  WHERE id = ANY(learner_uuids) AND role = 'learner';
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';