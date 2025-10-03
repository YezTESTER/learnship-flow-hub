-- Drop all existing storage policies to fix bucket ID issues
DROP POLICY IF EXISTS "Admins full access to Personal Documents" ON storage.objects;
DROP POLICY IF EXISTS "Learners can access own Personal Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins full access to Office Documents" ON storage.objects;
DROP POLICY IF EXISTS "Learners can access own Office Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins full access to Contracts" ON storage.objects;
DROP POLICY IF EXISTS "Learners can access own Contracts" ON storage.objects;
DROP POLICY IF EXISTS "Admins full access to CVs" ON storage.objects;
DROP POLICY IF EXISTS "Learners can access own CVs" ON storage.objects;

-- Personal Documents bucket policies (using correct bucket ID: personal-documents)
CREATE POLICY "Admins full access to personal-documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'personal-documents' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own personal-documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'personal-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Office Documents bucket policies (using correct bucket ID: office-documents)
CREATE POLICY "Admins full access to office-documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'office-documents' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own office-documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'office-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Contracts bucket policies
CREATE POLICY "Admins full access to contracts"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'contracts' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own contracts"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CVs bucket policies
CREATE POLICY "Admins full access to cvs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'cvs' 
  AND public.get_current_user_role() = 'admin'
);

CREATE POLICY "Learners can access own cvs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);