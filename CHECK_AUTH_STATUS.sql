-- Check if you're authenticated at all
SELECT auth.role() as current_role;

-- Check current session info
SELECT current_user, session_user;

-- Try to get user info from auth.users table
SELECT id, email, created_at FROM auth.users LIMIT 5;