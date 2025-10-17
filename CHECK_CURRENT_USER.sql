-- Check your current authenticated user ID
SELECT auth.uid() as current_user_id;

-- Check if there's a profile matching your current user ID
SELECT id, full_name, role, email 
FROM public.profiles 
WHERE id = auth.uid();