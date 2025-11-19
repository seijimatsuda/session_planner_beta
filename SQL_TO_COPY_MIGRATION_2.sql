DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

CREATE POLICY "All authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drill-videos');

CREATE POLICY "All authenticated users can view all media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'drill-videos');

CREATE POLICY "All authenticated users can delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'drill-videos');

