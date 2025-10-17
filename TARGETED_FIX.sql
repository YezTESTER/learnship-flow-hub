-- TARGETED FIX FOR SPECIFIC APPLICATION ISSUES
-- Run this in your Supabase SQL editor

-- 1. Fix RLS policies for profiles (this is the main issue)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Mentors can view their learners" ON public.profiles;

-- Essential policy: Users must be able to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Essential policy: Admins must be able to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Essential policy: Mentors must be able to view assigned learners and their own profile
CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Make sure the profiles table allows SELECT for authenticated users
GRANT SELECT ON public.profiles TO authenticated;

-- 3. Test if we can access profiles (this should work after the fix)
-- SELECT id, full_name, role, email FROM public.profiles WHERE id = auth.uid();

-- 4. Check what roles exist
-- SELECT DISTINCT role FROM public.profiles;

-- 5. Refresh schema
NOTIFY pgrst, 'reload schema';