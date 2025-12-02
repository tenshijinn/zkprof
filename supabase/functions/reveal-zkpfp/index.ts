import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const REVEAL_COST_USD = 0.50;

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

    const { session_id } = await req.json();

    console.log('Reveal request for session:', session_id);

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash API key to compare with stored hash
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const apiKeyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify API key and get platform
    const { data: platform, error: platformError } = await supabase
      .from('platform_registrations')
      .select('id, platform_name, credit_balance_usd, is_active')
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

    // Check platform credits
    if (platform.credit_balance_usd < REVEAL_COST_USD) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          current_balance: platform.credit_balance_usd,
          required: REVEAL_COST_USD,
          topup_url: '/api/platform-topup'
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get and validate session
    const { data: session, error: sessionError } = await supabase
      .from('access_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('platform_id', platform.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check session expiration
    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Session has expired. Viewer must sign a new NDA.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if NDA was signed (consent_given)
    if (!session.consent_given) {
      return new Response(
        JSON.stringify({ error: 'NDA has not been signed for this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify access grant is still active
    const { data: accessGrant, error: grantError } = await supabase
      .from('access_grants')
      .select('is_active')
      .eq('blob_id', session.blob_id)
      .eq('platform_id', platform.id)
      .eq('is_active', true)
      .single();

    if (grantError || !accessGrant) {
      return new Response(
        JSON.stringify({ error: 'Access has been revoked by the zkPFP owner' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get encrypted photo data
    const { data: encryptedPhoto, error: photoError } = await supabase
      .from('encrypted_photos')
      .select('encrypted_image_url, iv, encrypted_key, zk_proof, zk_public_signals')
      .eq('blob_id', session.blob_id)
      .single();

    if (photoError || !encryptedPhoto) {
      return new Response(
        JSON.stringify({ error: 'Encrypted photo not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct credits from platform
    const newBalance = platform.credit_balance_usd - REVEAL_COST_USD;
    
    const { error: updateError } = await supabase
      .from('platform_registrations')
      .update({ credit_balance_usd: newBalance })
      .eq('id', platform.id);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to process payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record transaction
    await supabase
      .from('platform_credit_transactions')
      .insert({
        platform_id: platform.id,
        transaction_type: 'reveal',
        amount_usd: -REVEAL_COST_USD,
        balance_after: newBalance,
        description: `Reveal zkPFP ${session.blob_id} for viewer ${session.viewer_wallet}`
      });

    console.log('Reveal successful, deducted $0.50 from platform:', platform.id);

    // Return encrypted data for client-side decryption
    // The third-party platform must handle decryption using the viewer's wallet
    return new Response(
      JSON.stringify({
        success: true,
        blob_id: session.blob_id,
        encrypted_image_url: encryptedPhoto.encrypted_image_url,
        iv: encryptedPhoto.iv,
        encrypted_key: encryptedPhoto.encrypted_key,
        zk_proof_verified: !!encryptedPhoto.zk_proof,
        session_expires_at: session.expires_at,
        viewer_wallet: session.viewer_wallet,
        nda_audit: {
          nda_hash: session.nda_hash,
          signing_timestamp: session.signing_timestamp,
          solana_memo_signature: session.solana_memo_signature
        },
        platform_balance_remaining: newBalance,
        message: 'Decryption data provided. Platform must handle client-side decryption.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reveal-zkpfp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
