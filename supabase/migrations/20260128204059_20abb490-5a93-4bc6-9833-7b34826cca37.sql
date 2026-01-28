-- Add viewer_display_name column to access_sessions table
ALTER TABLE public.access_sessions 
ADD COLUMN viewer_display_name text;

-- Add comment for documentation
COMMENT ON COLUMN public.access_sessions.viewer_display_name IS 'Optional display name/username of the viewer provided by the platform during NDA signing';

-- Create platform_profile_links table for linking zkPFPs to platform user profiles
CREATE TABLE public.platform_profile_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id uuid NOT NULL REFERENCES public.platform_registrations(id),
  blob_id text NOT NULL,
  platform_user_id text NOT NULL,
  wallet_address text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- One link per zkPFP per platform
  CONSTRAINT unique_platform_blob UNIQUE (platform_id, blob_id),
  -- One zkPFP per user per platform
  CONSTRAINT unique_platform_user UNIQUE (platform_id, platform_user_id)
);

-- Enable RLS
ALTER TABLE public.platform_profile_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_profile_links
CREATE POLICY "Anyone can view profile links"
ON public.platform_profile_links
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create profile links"
ON public.platform_profile_links
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update profile links"
ON public.platform_profile_links
FOR UPDATE
USING (true);

-- Add index for faster lookups
CREATE INDEX idx_platform_profile_links_wallet ON public.platform_profile_links(wallet_address);
CREATE INDEX idx_platform_profile_links_blob ON public.platform_profile_links(blob_id);