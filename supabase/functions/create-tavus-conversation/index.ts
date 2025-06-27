import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TavusAPI } from '../_shared/tavus.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { conversation_request } = await req.json()

    // Get Tavus API key from environment
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY')
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured')
    }

    // Create Tavus API instance
    const tavusAPI = new TavusAPI(tavusApiKey)

    // Ensure callback URL is set
    if (!conversation_request.callback_url) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      conversation_request.callback_url = `${supabaseUrl}/functions/v1/tavus-callback`
    }

    // Ensure properties are set with defaults
    conversation_request.properties = {
      max_call_duration: 3600,
      enable_recording: true,
      enable_transcription: true,
      apply_greenscreen: false,
      ...conversation_request.properties
    }

    // Create the conversation
    const response = await tavusAPI.createConversation(conversation_request)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating Tavus conversation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})