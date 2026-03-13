import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // user_id e platform codificados aqui
    
    if (!code || !state) {
      throw new Error('Código ou estado ausente')
    }

    const { userId, platform } = JSON.parse(atob(state))

    if (platform !== 'google') {
      throw new Error('Plataforma não suportada')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tokenUrl = 'https://oauth2.googleapis.com/token'
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Configuração incompleta: GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não definidos no Supabase')
    }

    const redirectUri = `${url.origin}/functions/v1/auth-callback`

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const data = await response.json()

    if (data.error) throw new Error(data.error_description || data.error)

    // Salvar no banco
    const { error: dbError } = await supabase
      .from('user_calendar_connections')
      .upsert({
        user_id: userId,
        platform,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })

    if (dbError) throw dbError

    // Redirecionar de volta para o app
    const appUrl = Deno.env.get('APP_URL') ?? url.origin.replace('.supabase.co', '.vercel.app') // Fallback genérico
    return Response.redirect(`${appUrl}/calendar?sync=success`, 303)

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
