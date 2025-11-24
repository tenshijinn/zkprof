-- Allow all MIME types for encrypted-pfps bucket since content is encrypted
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'encrypted-pfps';