-- Create storage bucket for opname images
INSERT INTO storage.buckets (id, name, public)
VALUES ('opname-images', 'opname-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for the opname-images bucket
CREATE POLICY "Allow anonymous uploads to opname-images bucket"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'opname-images'
);

CREATE POLICY "Allow anonymous read access to opname-images bucket"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'opname-images'
);

CREATE POLICY "Allow anonymous update access to opname-images bucket"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'opname-images'
);

CREATE POLICY "Allow anonymous delete access to opname-images bucket"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'opname-images'
);