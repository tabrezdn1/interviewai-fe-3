/*
  # Fix Tavus RPC Functions Status Field
  
  1. Changes
    - Update RPC functions to use 'status' instead of 'status_code' field
    - Fix the field name in all three Tavus API functions
    
  2. Purpose
    - Fix the error "record http_response has no field status_code"
    - Ensure proper communication with Tavus API via HTTP extension
*/

-- Drop all existing versions of the Tavus functions to resolve conflicts
DROP FUNCTION IF EXISTS public.create_tavus_conversation(conversation_request json);
DROP FUNCTION IF EXISTS public.create_tavus_conversation(conversation_request jsonb);
DROP FUNCTION IF EXISTS public.end_tavus_conversation(conversation_id text);
DROP FUNCTION IF EXISTS public.delete_tavus_persona(persona_id text);

-- Create a new create_tavus_conversation function with correct status field
CREATE OR REPLACE FUNCTION public.create_tavus_conversation(conversation_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    api_key text;
    request_body text;
    response_body text;
    http_response record;
BEGIN
    -- Get Tavus API key from environment
    SELECT decrypted_secret INTO api_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'TAVUS_API_KEY';
    
    IF api_key IS NULL THEN
        RAISE EXCEPTION 'Tavus API key not found in vault';
    END IF;
    
    -- Convert jsonb to text for HTTP request
    request_body := conversation_request::text;
    
    -- Make HTTP request to Tavus API
    SELECT * INTO http_response
    FROM http((
        'POST',
        'https://tavusapi.com/v2/conversations',
        ARRAY[
            http_header('Authorization', 'Bearer ' || api_key),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        request_body
    )::http_request);
    
    -- Check if request was successful - using status instead of status_code
    IF http_response.status >= 400 THEN
        RAISE EXCEPTION 'Tavus API error: % - %', http_response.status, http_response.content;
    END IF;
    
    -- Parse and return response
    result := http_response.content::jsonb;
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create Tavus conversation: %', SQLERRM;
END;
$$;

-- Create a new end_tavus_conversation function with correct status field
CREATE OR REPLACE FUNCTION public.end_tavus_conversation(conversation_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_key text;
    http_response record;
BEGIN
    -- Get Tavus API key from environment
    SELECT decrypted_secret INTO api_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'TAVUS_API_KEY';
    
    IF api_key IS NULL THEN
        RAISE EXCEPTION 'Tavus API key not found in vault';
    END IF;
    
    -- Make HTTP request to end conversation
    SELECT * INTO http_response
    FROM http((
        'PATCH',
        'https://tavusapi.com/v2/conversations/' || conversation_id || '/end',
        ARRAY[
            http_header('Authorization', 'Bearer ' || api_key),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'
    )::http_request);
    
    -- Check if request was successful - using status instead of status_code
    IF http_response.status >= 400 THEN
        RAISE EXCEPTION 'Tavus API error: % - %', http_response.status, http_response.content;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to end Tavus conversation: %', SQLERRM;
END;
$$;

-- Create a new delete_tavus_persona function with correct status field
CREATE OR REPLACE FUNCTION public.delete_tavus_persona(persona_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_key text;
    http_response record;
BEGIN
    -- Get Tavus API key from environment
    SELECT decrypted_secret INTO api_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'TAVUS_API_KEY';
    
    IF api_key IS NULL THEN
        RAISE EXCEPTION 'Tavus API key not found in vault';
    END IF;
    
    -- Make HTTP request to delete persona
    SELECT * INTO http_response
    FROM http((
        'DELETE',
        'https://tavusapi.com/v2/personas/' || persona_id,
        ARRAY[
            http_header('Authorization', 'Bearer ' || api_key)
        ],
        NULL,
        NULL
    )::http_request);
    
    -- Check if request was successful - using status instead of status_code
    IF http_response.status >= 400 THEN
        RAISE EXCEPTION 'Tavus API error: % - %', http_response.status, http_response.content;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete Tavus persona: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tavus_conversation(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_tavus_conversation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tavus_persona(text) TO authenticated;