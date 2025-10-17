-- Diagnostic queries to understand the current state of your database

-- 1. Check current user and their role
SELECT auth.uid() as current_user_id, 
       (SELECT role FROM public.profiles WHERE id = auth.uid()) as current_user_role;

-- 2. Check if we can access our own profile
SELECT id, full_name, role, email 
FROM public.profiles 
WHERE id = auth.uid();

-- 3. Check RLS policies on profiles table
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass;

-- 4. Check if mentor_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'mentor_id';

-- 5. Count profiles by role
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role;

-- 6. Check a few sample profiles
SELECT id, full_name, role, mentor_id, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;