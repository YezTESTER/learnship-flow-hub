-- AUTHENTICATION DIAGNOSTIC QUERIES
-- Run these queries in your Supabase SQL editor to diagnose auth issues

-- 1. Check if any users exist in auth.users
SELECT id, email, created_at FROM auth.users LIMIT 10;

-- 2. Check if profiles exist
SELECT id, full_name, role, email FROM public.profiles LIMIT 10;

-- 3. Check if there's a mismatch between auth.users and public.profiles
SELECT 
  a.id as auth_id,
  a.email as auth_email,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.email as profile_email
FROM auth.users a
FULL OUTER JOIN public.profiles p ON a.id = p.id
LIMIT 20;

-- 4. Check for orphaned profiles (profiles without matching auth users)
SELECT p.id, p.full_name, p.email
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users a WHERE a.id = p.id
);

-- 5. Check for auth users without profiles
SELECT a.id, a.email
FROM auth.users a
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = a.id
);

-- 6. TEST: Try to access profiles (this should work with relaxed policies)
SELECT id, full_name, role FROM public.profiles LIMIT 3;

-- 7. TEST: Try to access a specific profile
-- SELECT id, full_name, role, email FROM public.profiles WHERE email = 'systems@whitepaperconcepts.co.za';