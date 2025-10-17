-- Verify that the fix worked
-- Run this after applying the APPLICATION_FIX.sql

-- Check current policies on profiles table
SELECT polname, polcmd, polroles, polqual
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass;

-- Check a few sample profiles to make sure data exists
SELECT id, full_name, role FROM public.profiles LIMIT 3;