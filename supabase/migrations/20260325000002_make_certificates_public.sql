-- Set the bucket to public
UPDATE storage.buckets
SET public = true
WHERE id = 'vaccination-certificates';

-- Ensure there is a public select policy
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vaccination-certificates');
