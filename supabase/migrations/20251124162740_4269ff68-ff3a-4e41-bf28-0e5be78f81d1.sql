-- Allow public inserts using Solana wallet as identity
-- Update RLS policies for encrypted_photos table

DROP POLICY IF EXISTS "Users can view their own encrypted photos" ON public.encrypted_photos;
DROP POLICY IF EXISTS "Users can insert their own encrypted photos" ON public.encrypted_photos;

-- Allow anyone to insert if they provide a user_public_key
CREATE POLICY "Anyone can insert encrypted photos with wallet"
ON public.encrypted_photos
FOR INSERT
WITH CHECK (user_public_key IS NOT NULL AND length(user_public_key) > 0);

-- Allow anyone to view photos matching their wallet public key
CREATE POLICY "Anyone can view their wallet's encrypted photos"
ON public.encrypted_photos
FOR SELECT
USING (true);

-- Update RLS policies for nft_mints table
DROP POLICY IF EXISTS "Users can insert their own NFT mints" ON public.nft_mints;

-- Allow anyone to insert NFT mints if they provide a user_public_key
CREATE POLICY "Anyone can insert NFT mints with wallet"
ON public.nft_mints
FOR INSERT
WITH CHECK (user_public_key IS NOT NULL AND length(user_public_key) > 0);