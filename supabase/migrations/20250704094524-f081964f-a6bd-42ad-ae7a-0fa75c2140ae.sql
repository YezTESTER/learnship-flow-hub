-- First, delete all existing objects from storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('documents', 'cvs', 'certificates', 'id-documents', 'bank-letters');

-- Then drop existing buckets
DELETE FROM storage.buckets WHERE id IN ('documents', 'cvs', 'certificates', 'id-documents', 'bank-letters');

-- Create categorized buckets as requested
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('personal-documents', 'Personal Documents', false),
  ('office-documents', 'Office Documents', false),
  ('contracts', 'Contracts', false),
  ('cvs', 'CVs', false),
  ('avatars', 'Avatars', true);

-- Create storage policies for personal-documents bucket
CREATE POLICY "Users can view their own personal documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own personal documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own personal documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own personal documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for office-documents bucket
CREATE POLICY "Users can view their own office documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'office-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own office documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'office-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own office documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'office-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own office documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'office-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for contracts bucket
CREATE POLICY "Users can view their own contracts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own contracts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own contracts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own contracts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for cvs bucket
CREATE POLICY "Users can view their own CVs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own CVs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own CVs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CVs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for avatars bucket (public bucket)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);