-- COMPLETE FIX FOR THE APPLICATION
-- Run this entire script in your Supabase SQL editor

-- 1. Ensure all RLS policies are correctly set
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view their learners" ON public.profiles;

-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy for mentors to view their assigned learners
CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Create the missing bulk assignment function
DROP FUNCTION IF EXISTS public.bulk_assign_learners_to_mentor(UUID[], UUID);

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

-- 3. Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 5. Test query - This should return your profiles if everything is working
SELECT id, full_name, role FROM public.profiles LIMIT 5;