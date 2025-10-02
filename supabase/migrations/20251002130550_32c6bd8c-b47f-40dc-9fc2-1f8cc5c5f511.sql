-- Drop all existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can access all personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all office documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own personal documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own personal documents" ON storage.objects;

-- Personal Documents bucket policies
-- Admins can do everything
CREATE POLICY "Admins full access to Personal Documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Personal Documents' 
  AND public.get_current_user_role() = 'admin'
);

-- Learners can manage their own documents
CREATE POLICY "Learners can access own Personal Documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Personal Documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Office Documents bucket policies
CREATE POLICY "Admins full access to Office Documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Office Documents' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own Office Documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Office Documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Contracts bucket policies
CREATE POLICY "Admins full access to Contracts"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Contracts' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own Contracts"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'Contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CVs bucket policies
CREATE POLICY "Admins full access to CVs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'CVs' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own CVs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'CVs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);