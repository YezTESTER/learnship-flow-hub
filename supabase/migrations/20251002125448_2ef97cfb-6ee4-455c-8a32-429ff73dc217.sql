-- Enable admins to download all documents from all buckets
-- Drop existing restrictive policies if any and create admin access policies

-- Personal Documents bucket - Admin access
DROP POLICY IF EXISTS "Admins can access all personal documents" ON storage.objects;
CREATE POLICY "Admins can access all personal documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Personal Documents' 
  AND public.get_current_user_role() = 'admin'
);

-- Office Documents bucket - Admin access
DROP POLICY IF EXISTS "Admins can access all office documents" ON storage.objects;
CREATE POLICY "Admins can access all office documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Office Documents' 
  AND public.get_current_user_role() = 'admin'
);

-- Contracts bucket - Admin access
DROP POLICY IF EXISTS "Admins can access all contracts" ON storage.objects;
CREATE POLICY "Admins can access all contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Contracts' 
  AND public.get_current_user_role() = 'admin'
);

-- CVs bucket - Admin access
DROP POLICY IF EXISTS "Admins can access all CVs" ON storage.objects;
CREATE POLICY "Admins can access all CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'CVs' 
  AND public.get_current_user_role() = 'admin'
);