-- This policy updates the existing RLS for the office-documents bucket
-- to allow for nested folders like /year/month/period/

-- Drop the old, more restrictive policy first
DROP POLICY IF EXISTS "Users can upload their own office documents" ON storage.objects;

-- Create a new, more flexible policy
CREATE POLICY "Users can upload their own office documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'office-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: The policies for SELECT, UPDATE, and DELETE on this bucket are already correct and do not need to be changed.