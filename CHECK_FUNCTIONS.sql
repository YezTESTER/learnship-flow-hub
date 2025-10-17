-- Check if our bulk assignment function exists
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%bulk_assign%';