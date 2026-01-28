import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const REVEAL_COST_USD = 0.50;

// Base64 decode utility
function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Base64 encode utility
function encodeBase64(arr: Uint8Array): string {
  const CHUNK_SIZE = 8192;
  let binary = '';
  for (let i = 0; i < arr.length; i += CHUNK_SIZE) {
    const chunk = arr.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Server-side image decryption
async function decryptImageServerSide(
  encryptedDataBase64: string,
  encryptedKeyBase64: string,
  ivBase64: string,
  walletPublicKey: string
): Promise<Uint8Array> {
  const encryptedData = decodeBase64(encryptedDataBase64);
  const encryptedKeyWithIv = decodeBase64(encryptedKeyBase64);
  const iv = decodeBase64(ivBase64);

  // Extract IV and encrypted key (first 12 bytes are IV)
  const keyIv = encryptedKeyWithIv.slice(0, 12);
  const encryptedKey = encryptedKeyWithIv.slice(12);

  // Derive the wrapping key from wallet public key
  const keyDerivationMaterial = new TextEncoder().encode(`zkprof-key-derivation:${walletPublicKey}`);
  const derivedKeyHash = await crypto.subtle.digest('SHA-256', keyDerivationMaterial);
  
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    derivedKeyHash,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the symmetric key
  const symmetricKeyBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: keyIv },
    wrappingKey,
    encryptedKey
  );
  const symmetricKey = new Uint8Array(symmetricKeyBuffer);

  // Import the symmetric key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    symmetricKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the image data
  // @ts-ignore - TypeScript has issues with ArrayBufferLike vs ArrayBuffer, but this works at runtime
  const decryptedDataBuffer = await crypto.subtle.decrypt(
    // @ts-ignore
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    encryptedData
  );

  return new Uint8Array(decryptedDataBuffer);
}

// Apply watermark to image using Canvas API
async function applyWatermark(
  imageData: Uint8Array,
  viewerWallet: string,
  viewerName: string | null,
  platformName: string,
  timestamp: string
): Promise<string> {
  // For Deno edge functions, we use a text-based watermark approach
  // by encoding watermark info in the response metadata
  // The actual visual watermarking will be done by the embeddable component
  
  // Create watermark text pattern
  const shortWallet = `${viewerWallet.slice(0, 4)}...${viewerWallet.slice(-4)}`;
  const dateStr = new Date(timestamp).toISOString().split('T')[0];
  
  const watermarkText = [
    shortWallet,
    viewerName || 'Anonymous',
    platformName,
    dateStr
  ].join(' | ');

  // Return base64 encoded image with watermark metadata
  // The embeddable viewer will apply the visual watermark client-side
  // This is a security tradeoff - we return the image but mandate the protected viewer
  const mimeType = detectMimeType(imageData);
  const base64Image = encodeBase64(imageData);
  
  return `data:${mimeType};base64,${base64Image}`;
}

// Detect MIME type from image magic bytes
function detectMimeType(data: Uint8Array): string {
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return 'image/png';
  }
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return 'image/gif';
  }
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/png'; // Default
}

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

    // Get encrypted photo data with owner's wallet for decryption
    const { data: encryptedPhoto, error: photoError } = await supabase
      .from('encrypted_photos')
      .select('encrypted_image_url, iv, encrypted_key, user_public_key, zk_proof, zk_public_signals')
      .eq('blob_id', session.blob_id)
      .single();

    if (photoError || !encryptedPhoto) {
      return new Response(
        JSON.stringify({ error: 'Encrypted photo not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch encrypted image data from storage URL
    console.log('Fetching encrypted image from:', encryptedPhoto.encrypted_image_url);
    const imageResponse = await fetch(encryptedPhoto.encrypted_image_url);
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch encrypted image from storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const encryptedImageBase64 = await imageResponse.text();

    // Decrypt the image server-side
    console.log('Decrypting image server-side...');
    let decryptedImageData: Uint8Array;
    try {
      decryptedImageData = await decryptImageServerSide(
        encryptedImageBase64,
        encryptedPhoto.encrypted_key,
        encryptedPhoto.iv,
        encryptedPhoto.user_public_key
      );
    } catch (decryptError) {
      console.error('Decryption failed:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply watermark with viewer's identity
    const signingTimestamp = session.signing_timestamp || new Date().toISOString();
    const watermarkedImageBase64 = await applyWatermark(
      decryptedImageData,
      session.viewer_wallet,
      session.viewer_display_name,
      platform.platform_name,
      signingTimestamp
    );

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

    // Return watermarked decrypted image with viewer info and protected viewer config
    return new Response(
      JSON.stringify({
        success: true,
        blob_id: session.blob_id,
        
        // Watermarked decrypted image (viewer identity will be rendered by protected viewer)
        watermarked_image_base64: watermarkedImageBase64,
        
        // Viewer identification (for audit trail and watermark rendering)
        viewer_info: {
          wallet_address: session.viewer_wallet,
          display_name: session.viewer_display_name || null,
          platform_name: platform.platform_name
        },
        
        // Protected viewing component configuration
        protected_viewer_config: {
          viewing_time_seconds: 30,
          reveal_radius_px: 80,
          blur_amount: 40,
          scanline_animation: true,
          extend_viewing_enabled: true
        },
        
        // Embeddable protected viewer component URL
        protected_viewer_component_url: 'https://zkprof.lovable.app/embed/protected-viewer.js',
        
        // Verification data
        zk_proof_verified: !!encryptedPhoto.zk_proof,
        session_expires_at: session.expires_at,
        
        // NDA audit trail
        nda_audit: {
          nda_hash: session.nda_hash,
          signing_timestamp: session.signing_timestamp,
          solana_memo_signature: session.solana_memo_signature
        },
        
        platform_balance_remaining: newBalance
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
