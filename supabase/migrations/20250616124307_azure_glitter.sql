/*
  # Fix Tavus RPC Function Overloading Issue

  1. Problem
    - Multiple versions of `create_tavus_conversation` function exist with different parameter types
    - PostgreSQL cannot choose between `json` and `jsonb` parameter types
    - This causes PGRST203 error when calling the RPC function

  2. Solution
    - Drop all existing versions of the conflicting functions
    - Recreate functions with explicit `jsonb` parameter types
    - Use `jsonb` for better performance and PostgreSQL compatibility

  3. Functions Fixed
    - `create_tavus_conversation` - for creating Tavus conversations
    - `end_tavus_conversation` - for ending conversations
    - `delete_tavus_persona` - for deleting personas
*/

-- Drop all existing versions of the Tavus functions to resolve overloading conflicts
DROP FUNCTION IF EXISTS public.create_tavus_conversation(conversation_request json);
DROP FUNCTION IF EXISTS public.create_tavus_conversation(conversation_request jsonb);
DROP FUNCTION IF EXISTS public.end_tavus_conversation(conversation_id text);
DROP FUNCTION IF EXISTS public.delete_tavus_persona(persona_id text);

-- Recreate create_tavus_conversation function with explicit jsonb parameter
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
    
    -- Check if request was successful
    IF http_response.status_code >= 400 THEN
        RAISE EXCEPTION 'Tavus API error: % - %', http_response.status_code, http_response.content;
    END IF;
    
    -- Parse and return response
    result := http_response.content::jsonb;
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create Tavus conversation: %', SQLERRM;
END;
$$;

-- Recreate end_tavus_conversation function
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
    
    -- Check if request was successful
    IF http_response.status_code >= 400 THEN
        RAISE EXCEPTION 'Tavus API error: % - %', http_response.status_code, http_response.content;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to end Tavus conversation: %', SQLERRM;
END;
$$;

-- Recreate delete_tavus_persona function
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
    
    -- Check if request was successful
    IF http_response.status_code >= 400 THEN
        RAISE EXCEPTION 'Tavus API error: % - %', http_response.status_code, http_response.content;
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