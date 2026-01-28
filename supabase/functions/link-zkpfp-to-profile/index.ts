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

    const { blob_id, platform_user_id, wallet_address } = await req.json();

    if (!blob_id || !platform_user_id || !wallet_address) {
      return new Response(
        JSON.stringify({ error: 'blob_id, platform_user_id, and wallet_address are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Linking zkPFP to profile:', { blob_id, platform_user_id, wallet_address });

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

    // Verify the zkPFP exists and belongs to this wallet
    const { data: photo, error: photoError } = await supabase
      .from('encrypted_photos')
      .select('blob_id, user_public_key')
      .eq('blob_id', blob_id)
      .single();

    if (photoError || !photo) {
      return new Response(
        JSON.stringify({ error: 'zkPFP not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify wallet ownership
    if (photo.user_public_key !== wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Wallet address does not match zkPFP owner' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify platform has active access grant for this zkPFP
    const { data: grant, error: grantError } = await supabase
      .from('access_grants')
      .select('id, is_active')
      .eq('blob_id', blob_id)
      .eq('platform_id', platform.id)
      .eq('is_active', true)
      .single();

    if (grantError || !grant) {
      return new Response(
        JSON.stringify({ error: 'Platform does not have active access grant for this zkPFP' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link already exists
    const { data: existingLink, error: existingError } = await supabase
      .from('platform_profile_links')
      .select('id')
      .eq('platform_id', platform.id)
      .eq('blob_id', blob_id)
      .maybeSingle();

    if (existingLink) {
      // Update existing link
      const { data: updatedLink, error: updateError } = await supabase
        .from('platform_profile_links')
        .update({ 
          platform_user_id, 
          wallet_address 
        })
        .eq('id', existingLink.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating link:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile link' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Updated profile link:', updatedLink.id);

      return new Response(
        JSON.stringify({
          success: true,
          link_id: updatedLink.id,
          message: 'zkPFP profile link updated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new profile link
    const { data: newLink, error: insertError } = await supabase
      .from('platform_profile_links')
      .insert({
        platform_id: platform.id,
        blob_id,
        platform_user_id,
        wallet_address
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating link:', insertError);
      
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'This user already has a zkPFP linked to their profile' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to create profile link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created profile link:', newLink.id);

    return new Response(
      JSON.stringify({
        success: true,
        link_id: newLink.id,
        message: 'zkPFP linked to profile successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in link-zkpfp-to-profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
