-- SECURE APPLICATION - Restore proper RLS policies
-- Run this after confirming the application is working

-- 1. Remove temporary relaxed policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. Restore proper RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

-- 3. Remove temporary permissions
REVOKE SELECT ON public.profiles FROM anon;

-- 4. Refresh schema
NOTIFY pgrst, 'reload schema';

-- 5. Test that policies work correctly
-- SELECT id, full_name, role FROM public.profiles WHERE id = auth.uid();