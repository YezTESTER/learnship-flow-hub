-- Check what RLS policies are currently on the profiles table
SELECT polname, polcmd, polroles, polqual
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass;