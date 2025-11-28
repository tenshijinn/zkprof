import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached price if still valid
    if (cachedPrice && (now - cachedPrice.timestamp) < CACHE_TTL) {
      console.log('Returning cached SOL price:', cachedPrice.price);
      return new Response(
        JSON.stringify({ price: cachedPrice.price, cached: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Fetch fresh price from Moralis
    console.log('Fetching fresh SOL price from Moralis...');
    const moralisApiKey = Deno.env.get('MORALIS_API_KEY');
    
    if (!moralisApiKey) {
      throw new Error('MORALIS_API_KEY not configured');
    }

    const response = await fetch(
      'https://solana-gateway.moralis.io/token/mainnet/So11111111111111111111111111111111111111112/price',
      {
        headers: {
          'X-API-Key': moralisApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.usdPrice;

    // Update cache
    cachedPrice = { price, timestamp: now };
    console.log('Fresh SOL price fetched and cached:', price);

    return new Response(
      JSON.stringify({ price, cached: false }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error fetching SOL price:', error);
    
    // If we have a cached price, return it even if expired as a fallback
    if (cachedPrice) {
      console.log('Returning stale cached price as fallback:', cachedPrice.price);
      return new Response(
        JSON.stringify({ price: cachedPrice.price, cached: true, stale: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch SOL price' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
