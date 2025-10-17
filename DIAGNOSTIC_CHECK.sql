-- Diagnostic check to understand what's happening
-- Run this in your Supabase SQL editor

-- 1. Check if profiles exist
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 2. Check a few sample profiles
SELECT id, full_name, role, email FROM public.profiles LIMIT 5;

-- 3. Check if your specific user profile exists (replace with your actual user ID)
-- SELECT id, full_name, role, email FROM public.profiles WHERE id = 'YOUR_USER_ID_HERE';

-- 4. Try to access profiles without RLS (as admin)
-- This should work if the data exists
SELECT id, full_name, role, email FROM public.profiles;

-- 5. Check current user context
SELECT auth.uid() as current_user_id, auth.role() as current_role;