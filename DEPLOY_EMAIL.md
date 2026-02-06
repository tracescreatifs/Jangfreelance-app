# Déploiement de la fonction Email Resend

## Option 1 : Via le Dashboard Supabase (Plus simple !)

1. **Va sur** : https://supabase.com/dashboard/project/pwjnavblbouxhyxejpaf/functions

2. **Clique sur** "Create a new function"

3. **Nom de la fonction** : `send-email`

4. **Copie ce code** dans l'éditeur :

```typescript
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY non configurée')
    }

    const { to, subject, html, fromName = 'Jang' }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      throw new Error('Paramètres manquants: to, subject et html sont requis')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      throw new Error('Format d\'email invalide')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <onboarding@resend.dev>`,
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Erreur Resend')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé', id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

5. **Clique sur** "Deploy"

6. **Ajouter le secret RESEND_API_KEY** :
   - Va dans : https://supabase.com/dashboard/project/pwjnavblbouxhyxejpaf/settings/functions
   - Clique sur "Add new secret"
   - Name: `RESEND_API_KEY`
   - Value: `re_E9SbtLXZ_5zJ2rwsMHcFNZpu27oRKR4EG`
   - Clique "Save"

## Option 2 : Via Terminal (nécessite Homebrew)

```bash
# Installer Homebrew d'abord
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Puis Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Lier le projet
supabase link --project-ref pwjnavblbouxhyxejpaf

# Ajouter le secret
supabase secrets set RESEND_API_KEY=re_E9SbtLXZ_5zJ2rwsMHcFNZpu27oRKR4EG

# Déployer
supabase functions deploy send-email --no-verify-jwt
```

## Test

Une fois déployée, tu peux tester en envoyant un email depuis l'app Jang !
