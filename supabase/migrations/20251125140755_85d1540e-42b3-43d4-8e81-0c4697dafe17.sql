-- Add DELETE policy for nft_mints to allow users to burn their NFTs
CREATE POLICY "Users can delete their own NFT mints"
ON public.nft_mints
FOR DELETE
USING (user_public_key IS NOT NULL AND length(user_public_key) > 0);