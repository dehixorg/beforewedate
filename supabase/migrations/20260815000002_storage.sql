-- Migration: 20260815000002_storage.sql
-- Description: Create profile_photos storage bucket and setup RLS policies.

-- 1. Insert bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
-- Note: It is usually enabled by default, but ensuring it is on.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for profile_photos bucket
-- Anyone can view profile photos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_photos');

-- Authenticated users can upload photos to their own directory 
-- The directory name must match their user ID
CREATE POLICY "Users can upload their own profile photos" 
ON storage.objects FOR INSERT
TO authenticated 
WITH CHECK (
    bucket_id = 'profile_photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile photos
CREATE POLICY "Users can update their own profile photos" 
ON storage.objects FOR UPDATE
TO authenticated 
USING (
    bucket_id = 'profile_photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile photos
CREATE POLICY "Users can delete their own profile photos" 
ON storage.objects FOR DELETE
TO authenticated 
USING (
    bucket_id = 'profile_photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
