// Supabase Edge Function pour PayDunya Checkout
// Deploy: via Supabase Dashboard

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PAYDUNYA_CONFIG = {
  masterKey: Deno.env.get('PAYDUNYA_MASTER_KEY') || '',
  privateKey: Deno.env.get('PAYDUNYA_PRIVATE_KEY') || '',
  token: Deno.env.get('PAYDUNYA_TOKEN') || '',
  mode: 'live' // 'test' ou 'live'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  callbackUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier les clés API
    if (!PAYDUNYA_CONFIG.masterKey || !PAYDUNYA_CONFIG.privateKey || !PAYDUNYA_CONFIG.token) {
      throw new Error('Configuration PayDunya manquante');
    }

    const body: CheckoutRequest = await req.json();
    const { amount, description, customerName, customerEmail, customerPhone, callbackUrl, returnUrl, cancelUrl } = body;

    // Validation
    if (!amount || !description) {
      throw new Error('Montant et description requis');
    }

    // Créer la facture PayDunya
    const invoiceData = {
      invoice: {
        total_amount: amount,
        description: description,
      },
      store: {
        name: 'Jang Freelance',
        tagline: 'Gestion freelance simplifiée',
        phone: '+221781234567',
        postal_address: 'Dakar, Sénégal',
        website_url: 'https://jang-freelance-app.vercel.app',
      },
      custom_data: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      actions: {
        callback_url: callbackUrl,
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    // Appel à l'API PayDunya
    const baseUrl = PAYDUNYA_CONFIG.mode === 'live'
      ? 'https://app.paydunya.com/api/v1'
      : 'https://app.paydunya.com/sandbox-api/v1';

    const response = await fetch(`${baseUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_CONFIG.masterKey,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_CONFIG.privateKey,
        'PAYDUNYA-TOKEN': PAYDUNYA_CONFIG.token,
      },
      body: JSON.stringify(invoiceData),
    });

    const result = await response.json();

    if (result.response_code === '00') {
      return new Response(
        JSON.stringify({
          success: true,
          token: result.token,
          invoiceUrl: result.response_text,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error(result.response_text || 'Erreur PayDunya');
    }

  } catch (error) {
    console.error('Erreur PayDunya:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
