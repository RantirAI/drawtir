-- Create storage bucket for poster images (simplified)
INSERT INTO storage.buckets (id, name)
VALUES ('posters', 'posters')
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload poster images
CREATE POLICY "Users can upload poster images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posters');

-- Allow authenticated users to update poster images  
CREATE POLICY "Users can update poster images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'posters');

-- Allow authenticated users to delete poster images
CREATE POLICY "Users can delete poster images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'posters');

-- Allow everyone to view poster images
CREATE POLICY "Anyone can view poster images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'posters');