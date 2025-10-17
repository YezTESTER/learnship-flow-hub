-- Simple query to check if we can access profile data
SELECT id, full_name, role 
FROM public.profiles 
WHERE id = auth.uid();