-- Check if any profiles exist at all
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check if we can see any profiles with a very permissive query
SELECT id, full_name, role FROM public.profiles LIMIT 5;

-- Check if your specific user profile exists (using your user ID from auth.users)
SELECT id, full_name, role, email 
FROM public.profiles 
WHERE id = '00901f9a-4113-43fc-bf6f-ff76ef316498';