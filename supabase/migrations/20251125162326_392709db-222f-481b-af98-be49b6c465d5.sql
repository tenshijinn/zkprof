-- Add ZK-SNARK proof columns to encrypted_photos table
ALTER TABLE public.encrypted_photos
ADD COLUMN IF NOT EXISTS zk_proof TEXT,
ADD COLUMN IF NOT EXISTS zk_public_signals TEXT[];

-- Add ZK-SNARK proof columns to nft_mints table  
ALTER TABLE public.nft_mints
ADD COLUMN IF NOT EXISTS zk_proof TEXT,
ADD COLUMN IF NOT EXISTS zk_public_signals TEXT[];

-- Add comment explaining the ZK proof fields
COMMENT ON COLUMN public.encrypted_photos.zk_proof IS 'Serialized ZK-SNARK proof proving knowledge of encryption key';
COMMENT ON COLUMN public.encrypted_photos.zk_public_signals IS 'Public signals from ZK-SNARK proof (commitment, wallet)';
COMMENT ON COLUMN public.nft_mints.zk_proof IS 'Serialized ZK-SNARK proof for NFT authenticity';
COMMENT ON COLUMN public.nft_mints.zk_public_signals IS 'Public signals from ZK-SNARK proof';