-- Migration: Enable Shared Storage Access for Coaching Staff
-- This allows all authenticated users to view/upload/delete all videos/images

-- Step 1: Drop existing user-specific storage policies
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

-- Step 2: Create new shared storage policies
-- All authenticated users can upload to drill-videos bucket
CREATE POLICY "All authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drill-videos');

-- All authenticated users can view all videos/images
CREATE POLICY "All authenticated users can view all media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'drill-videos');

-- All authenticated users can delete any video/image
CREATE POLICY "All authenticated users can delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'drill-videos');

