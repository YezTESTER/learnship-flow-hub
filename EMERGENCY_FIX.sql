-- Emergency fix to restore basic functionality
-- Run these queries one by one to restore access

-- 1. Temporarily disable RLS on profiles to diagnose the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Check if you can now access profile data
SELECT id, full_name, role, email 
FROM public.profiles 
WHERE id = auth.uid();

-- 3. If the above works, re-enable RLS with a simple policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create a simple, non-recursive policy
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 5. Create a simple policy for admins
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Create a simple policy for mentors
CREATE POLICY "Mentors can view their learners" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );