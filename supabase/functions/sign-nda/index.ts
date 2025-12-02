import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";

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

    // Get client IP and user agent for audit trail
    const signerIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const signerUserAgent = req.headers.get('user-agent') || 'unknown';

    const { 
      blob_id, 
      platform_id, 
      viewer_wallet, 
      signature, 
      nda_hash,
      consent_given,
      solana_memo_signature 
    } = await req.json();

    console.log('Signing NDA:', { blob_id, platform_id, viewer_wallet, nda_hash });

    // Validate required fields
    if (!blob_id || !platform_id || !viewer_wallet || !signature || !nda_hash) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!consent_given) {
      return new Response(
        JSON.stringify({ error: 'Consent is required to sign the NDA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify platform exists and is active
    const { data: platform, error: platformError } = await supabase
      .from('platform_registrations')
      .select('id, platform_name, is_active')
      .eq('id', platform_id)
      .single();

    if (platformError || !platform || !platform.is_active) {
      return new Response(
        JSON.stringify({ error: 'Platform not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify access grant exists
    const { data: accessGrant, error: grantError } = await supabase
      .from('access_grants')
      .select('id, is_active')
      .eq('blob_id', blob_id)
      .eq('platform_id', platform_id)
      .eq('is_active', true)
      .single();

    if (grantError || !accessGrant) {
      return new Response(
        JSON.stringify({ error: 'Access not granted for this zkPFP on this platform' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify wallet signature
    // The message being signed should be the NDA hash
    const message = `Sign NDA Agreement\n\nHash: ${nda_hash}\n\nBy signing, I agree to the NDA terms.`;
    const messageBytes = new TextEncoder().encode(message);
    
    try {
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(viewer_wallet);
      
      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid wallet signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Signature verification failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signingTimestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes

    // Create access session with ESIGN compliance data
    const { data: session, error: sessionError } = await supabase
      .from('access_sessions')
      .insert({
        blob_id,
        platform_id,
        viewer_wallet,
        nda_message: message,
        nda_signature: signature,
        nda_hash,
        signer_ip: signerIp,
        signer_user_agent: signerUserAgent,
        signing_timestamp: signingTimestamp,
        solana_memo_signature: solana_memo_signature || null,
        consent_given: true,
        payment_amount_usd: 0.50, // Will be charged when reveal is called
        expires_at: expiresAt
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create access session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('NDA signed successfully, session:', session.id);

    return new Response(
      JSON.stringify({
        session_id: session.id,
        expires_at: expiresAt,
        signing_timestamp: signingTimestamp,
        message: 'NDA signed successfully. You can now request image reveal.',
        audit_trail: {
          nda_hash,
          signer_wallet: viewer_wallet,
          signing_timestamp: signingTimestamp,
          solana_memo_signature: solana_memo_signature || 'Not provided'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sign-nda:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
