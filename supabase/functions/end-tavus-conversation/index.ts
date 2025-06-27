import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TavusAPI } from '../_shared/tavus.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { conversation_id } = await req.json()

    // Get Tavus API key from environment
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY')
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured')
    }

    // Create Tavus API instance
    const tavusAPI = new TavusAPI(tavusApiKey)

    // End the conversation
    await tavusAPI.endConversation(conversation_id)

    return new Response(
      JSON.stringify({ 
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error ending Tavus conversation:', error)
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