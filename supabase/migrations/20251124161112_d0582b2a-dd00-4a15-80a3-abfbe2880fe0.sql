-- Fix RLS policies for encrypted_photos table
-- Remove the permissive OR true condition that allows public access
DROP POLICY IF EXISTS "Users can view their own encrypted photos" ON public.encrypted_photos;

CREATE POLICY "Users can view their own encrypted photos"
ON public.encrypted_photos
FOR SELECT
USING (user_public_key = auth.uid()::text);

-- Fix INSERT policy to require authentication
DROP POLICY IF EXISTS "Users can insert their own encrypted photos" ON public.encrypted_photos;

CREATE POLICY "Users can insert their own encrypted photos"
ON public.encrypted_photos
FOR INSERT
WITH CHECK (user_public_key = auth.uid()::text);

-- Fix INSERT policy for nft_mints to require authentication
DROP POLICY IF EXISTS "Users can insert their own NFT mints" ON public.nft_mints;

CREATE POLICY "Users can insert their own NFT mints"
ON public.nft_mints
FOR INSERT
WITH CHECK (user_public_key = auth.uid()::text);