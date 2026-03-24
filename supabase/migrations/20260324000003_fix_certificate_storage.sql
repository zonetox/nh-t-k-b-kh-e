-- Ensure vaccination-certificates storage bucket exists and has correct RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vaccination-certificates', 
  'vaccination-certificates', 
  false, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can upload own certificates" ON storage.objects;
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vaccination-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own certificates" ON storage.objects;
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vaccination-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own certificates" ON storage.objects;
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vaccination-certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
