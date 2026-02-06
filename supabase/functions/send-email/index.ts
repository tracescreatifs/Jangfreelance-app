// Supabase Edge Function pour l'envoi d'emails via Resend
// Deploy: supabase functions deploy send-email --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  fromName?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier la clé API
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY non configurée')
    }

    const { to, subject, html, fromName = 'Jang' }: EmailRequest = await req.json()

    // Validation
    if (!to || !subject || !html) {
      throw new Error('Paramètres manquants: to, subject et html sont requis')
    }

    // Valider le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      throw new Error('Format d\'email invalide')
    }

    // Envoyer via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <onboarding@resend.dev>`, // Domaine par défaut Resend, à changer avec ton domaine vérifié
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Erreur Resend:', result)
      throw new Error(result.message || 'Erreur lors de l\'envoi via Resend')
    }

    console.log('Email envoyé avec succès:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email envoyé avec succès',
        id: result.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erreur:', error.message)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
