import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required in x-api-key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { wallet_address } = await req.json();

    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting zkPFPs for wallet:', wallet_address);

    // Hash API key to compare with stored hash
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const apiKeyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify API key and get platform
    const { data: platform, error: platformError } = await supabase
      .from('platform_registrations')
      .select('id, platform_name, is_active')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (platformError || !platform) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!platform.is_active) {
      return new Response(
        JSON.stringify({ error: 'Platform account is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all encrypted photos for this wallet
    const { data: photos, error: photosError } = await supabase
      .from('encrypted_photos')
      .select('blob_id, created_at, zk_proof')
      .eq('user_public_key', wallet_address)
      .order('created_at', { ascending: false });

    if (photosError) {
      console.error('Error fetching photos:', photosError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch zkPFPs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!photos || photos.length === 0) {
      return new Response(
        JSON.stringify({
          wallet_address,
          zkpfps: [],
          total_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get access grants for this platform
    const blobIds = photos.map(p => p.blob_id);
    const { data: grants, error: grantsError } = await supabase
      .from('access_grants')
      .select('blob_id, is_active')
      .eq('platform_id', platform.id)
      .in('blob_id', blobIds);

    // Get profile links for this platform
    const { data: links, error: linksError } = await supabase
      .from('platform_profile_links')
      .select('blob_id, platform_user_id')
      .eq('platform_id', platform.id)
      .in('blob_id', blobIds);

    // Build response with access status and profile links
    const zkpfps = photos.map(photo => {
      const grant = grants?.find(g => g.blob_id === photo.blob_id);
      const link = links?.find(l => l.blob_id === photo.blob_id);
      
      return {
        blob_id: photo.blob_id,
        created_at: photo.created_at,
        has_zk_proof: !!photo.zk_proof,
        access_granted: grant?.is_active || false,
        linked_profile_id: link?.platform_user_id || null
      };
    });

    console.log(`Found ${zkpfps.length} zkPFPs for wallet ${wallet_address}`);

    return new Response(
      JSON.stringify({
        wallet_address,
        zkpfps,
        total_count: zkpfps.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-user-zkpfps:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
