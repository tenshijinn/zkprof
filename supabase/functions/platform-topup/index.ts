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

    const { amount_usd, solana_signature } = await req.json();

    console.log('Topup request:', { amount_usd, solana_signature });

    if (!amount_usd || !solana_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount_usd, solana_signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount_usd <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be positive' }),
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

    // TODO: In production, verify the Solana transaction signature on-chain
    // This would involve:
    // 1. Fetching the transaction from Solana RPC
    // 2. Verifying the payment amount matches
    // 3. Verifying the recipient is zkProf's treasury wallet
    // 4. Verifying the transaction is confirmed
    // For now, we trust the signature and record it

    // Check if signature was already used
    const { data: existingTopup } = await supabase
      .from('platform_credit_topups')
      .select('id')
      .eq('solana_signature', solana_signature)
      .single();

    if (existingTopup) {
      return new Response(
        JSON.stringify({ error: 'This transaction has already been processed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update platform credit balance
    const newBalance = Number(platform.credit_balance_usd) + Number(amount_usd);
    
    const { error: updateError } = await supabase
      .from('platform_registrations')
      .update({ 
        credit_balance_usd: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', platform.id);

    if (updateError) {
      console.error('Failed to update balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record topup transaction
    await supabase
      .from('platform_credit_topups')
      .insert({
        platform_id: platform.id,
        amount_usd,
        solana_signature
      });

    // Record in transaction history
    await supabase
      .from('platform_credit_transactions')
      .insert({
        platform_id: platform.id,
        transaction_type: 'topup',
        amount_usd: amount_usd,
        balance_after: newBalance,
        transaction_signature: solana_signature,
        description: `Credit topup via Solana payment`
      });

    console.log('Topup successful:', { platform_id: platform.id, amount_usd, newBalance });

    return new Response(
      JSON.stringify({
        success: true,
        platform_id: platform.id,
        amount_added: amount_usd,
        previous_balance: platform.credit_balance_usd,
        new_balance: newBalance,
        transaction_signature: solana_signature,
        message: `Successfully added $${amount_usd} to your account`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in platform-topup:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
