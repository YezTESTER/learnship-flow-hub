-- Simple diagnostic - Run this first and tell me what you see
SELECT id, full_name, role 
FROM public.profiles 
WHERE id = auth.uid();