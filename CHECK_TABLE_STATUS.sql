
-- CHECK TABLE STATUS
-- Run this to see which tables have RLS enabled and what policies exist

-- Check RLS status for all public tables
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  forcrowsecurity AS force_rls
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check existing policies on public tables
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check some sample data to verify structure
SELECT id, full_name, role, mentor_id FROM public.profiles LIMIT 5;
SELECT id, learner_id, status FROM public.feedback_submissions LIMIT 5;
SELECT id, learner_id, document_type FROM public.documents LIMIT 5;