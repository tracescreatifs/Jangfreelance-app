import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys depuis les variables d'environnement
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = 'mailto:tracescreatifs@gmail.com';

// ── Crypto helpers pour Web Push ──────────────────────────────

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return base64UrlEncode(new Uint8Array(buffer));
}

async function generateJWT(audience: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 heures
    sub: VAPID_SUBJECT,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Importer la clé privée VAPID (format raw P-256)
  const rawKey = base64UrlDecode(VAPID_PRIVATE_KEY);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: base64UrlEncode(rawKey),
    // On doit dériver x, y depuis la clé publique
    x: base64UrlEncode(base64UrlDecode(VAPID_PUBLIC_KEY).slice(1, 33)),
    y: base64UrlEncode(base64UrlDecode(VAPID_PUBLIC_KEY).slice(33, 65)),
  };

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convertir la signature DER vers raw (r || s, 64 bytes)
  const sigBytes = new Uint8Array(signature);
  let r, s;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  } else {
    // Déjà en format raw sur la plupart des plateformes
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  }
  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsignedToken}.${base64UrlEncode(rawSig)}`;
}

// ── Envoi push ───────────────────────────────────────────────

async function sendPushToEndpoint(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await generateJWT(audience);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'identity',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body: payload,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, statusCode: response.status };
    }

    // 410 Gone → subscription expirée
    if (response.status === 410 || response.status === 404) {
      return { success: false, statusCode: response.status, error: 'subscription_expired' };
    }

    const text = await response.text();
    return { success: false, statusCode: response.status, error: text };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ── Handler ──────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, url, tag, type } = await req.json();

    if (!userId && !title) {
      return new Response(
        JSON.stringify({ error: 'userId ou title requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialiser le client Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Récupérer les subscriptions de l'utilisateur
    let query = supabase.from('push_subscriptions').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Erreur récupération subscriptions', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucune subscription trouvée', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title: title || 'Jang - Freelance',
      body: body || '',
      url: url || '/',
      tag: tag || 'jang-notification',
      type: type || 'general',
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const result = await sendPushToEndpoint(sub.endpoint, sub.p256dh, sub.auth, payload);
      if (result.success) {
        sent++;
      } else {
        failed++;
        if (result.error === 'subscription_expired') {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Nettoyer les subscriptions expirées
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, failed, expired_cleaned: expiredEndpoints.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
