-- Script to check the current state of the app and verify restoration

-- Check profiles table structure
\d public.profiles

-- Check RLS policies on profiles table
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass;

-- Check if the mentor_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'mentor_id';

-- Check if the security definer functions exist
SELECT proname, prokind 
FROM pg_proc 
WHERE proname IN ('assign_learner_to_mentor', 'unassign_learner_from_mentor', 'bulk_assign_learners_to_mentor');

-- Check a sample of profiles to verify data integrity
SELECT id, full_name, role, mentor_id 
FROM public.profiles 
LIMIT 10;

-- Check RLS policies on feedback_submissions table
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policy 
WHERE polrelid = 'public.feedback_submissions'::regclass;

-- Check RLS policies on documents table
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policy 
WHERE polrelid = 'public.documents'::regclass;