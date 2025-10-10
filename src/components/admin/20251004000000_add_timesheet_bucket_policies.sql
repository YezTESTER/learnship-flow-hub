-- Policies for the new "Bi-Weekly Timsheets" bucket
-- The bucket name in Supabase should be "bi-weekly-timesheets"

-- Admins can do everything
CREATE POLICY "Admins full access to bi-weekly-timesheets"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'bi-weekly-timesheets'
  AND public.get_current_user_role() = 'admin'
);

-- Learners can manage their own documents
CREATE POLICY "Learners can access own bi-weekly-timesheets"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'bi-weekly-timesheets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);