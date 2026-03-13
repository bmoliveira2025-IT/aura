import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, platform } = await req.json()

    // 1. Get tokens
    const { data: connection, error: connError } = await supabase
      .from('user_calendar_connections')
      .select('*')
      .eq('user_id', user_id)
      .eq('platform', platform)
      .single()

    if (connError || !connection) throw new Error('Conexão não encontrada')

    let accessToken = connection.access_token

    // 1.5 Refresh token if expired
    if (new Date(connection.expires_at) <= new Date()) {
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        })
      })
      const data = await resp.json()
      if (data.access_token) {
        accessToken = data.access_token
        await supabase.from('user_calendar_connections').update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
        }).eq('id', connection.id)
      }
    }

    // 2. Fetch events (Google only)
    if (platform === 'google') {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      
      const data = await response.json()
      
      if (data.items) {
        for (const gEvent of data.items) {
          await supabase.from('events').upsert({
            user_id,
            title: gEvent.summary,
            description: gEvent.description,
            start_at: gEvent.start.dateTime || gEvent.start.date,
            end_at: gEvent.end.dateTime || gEvent.end.date,
            location: gEvent.location,
            platform: 'google',
            external_id: gEvent.id
          }, { onConflict: 'external_id' })
        }
      }
    }

    return new Response(JSON.stringify({ message: "Sync complete" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
