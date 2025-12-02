import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { blob_id, platform_id, viewer_wallet, owner_wallet } = await req.json();

    console.log('Getting NDA template for:', { blob_id, platform_id, viewer_wallet });

    // Validate inputs
    if (!blob_id || !platform_id || !viewer_wallet) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: blob_id, platform_id, viewer_wallet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get platform info
    const { data: platform, error: platformError } = await supabase
      .from('platform_registrations')
      .select('platform_name')
      .eq('id', platform_id)
      .eq('is_active', true)
      .single();

    if (platformError || !platform) {
      return new Response(
        JSON.stringify({ error: 'Platform not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get zkPFP owner wallet if not provided
    let actualOwnerWallet = owner_wallet;
    if (!actualOwnerWallet) {
      const { data: nftMint, error: nftError } = await supabase
        .from('nft_mints')
        .select('user_public_key')
        .eq('blob_id', blob_id)
        .single();

      if (nftError || !nftMint) {
        return new Response(
          JSON.stringify({ error: 'zkPFP not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      actualOwnerWallet = nftMint.user_public_key;
    }

    // Get default NDA template
    const { data: template, error: templateError } = await supabase
      .from('nda_templates')
      .select('template_content')
      .eq('is_default', true)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: 'NDA template not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate timestamp
    const timestamp = new Date().toISOString();

    // Populate template with actual values
    let populatedNda = template.template_content
      .replace(/\{\{timestamp\}\}/g, timestamp)
      .replace(/\{\{owner_wallet\}\}/g, actualOwnerWallet)
      .replace(/\{\{viewer_wallet\}\}/g, viewer_wallet)
      .replace(/\{\{platform_name\}\}/g, platform.platform_name);

    // Generate NDA hash (SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(populatedNda);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ndaHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Replace hash placeholder
    populatedNda = populatedNda.replace(/\{\{nda_hash\}\}/g, ndaHash);

    console.log('NDA template generated successfully, hash:', ndaHash);

    return new Response(
      JSON.stringify({
        nda_content: populatedNda,
        nda_hash: ndaHash,
        timestamp,
        owner_wallet: actualOwnerWallet,
        viewer_wallet,
        platform_name: platform.platform_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-nda-template:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
