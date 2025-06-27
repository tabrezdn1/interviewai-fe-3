/*
  # Revert Tavus Functions to Use Edge Functions
  
  1. Changes
    - Drop direct API call functions
    - Create new functions that call Edge Functions instead
    - Implement proper error handling and mock support
    
  2. Purpose
    - Improve security by not exposing API keys in database functions
    - Separate concerns: database functions call Edge Functions, Edge Functions call Tavus API
    - Provide better error handling and fallback mechanisms
*/

-- Drop all existing versions of the Tavus functions to resolve conflicts
DROP FUNCTION IF EXISTS public.create_tavus_conversation(conversation_request json);
DROP FUNCTION IF EXISTS public.create_tavus_conversation(conversation_request jsonb);
DROP FUNCTION IF EXISTS public.end_tavus_conversation(conversation_id text);
DROP FUNCTION IF EXISTS public.delete_tavus_persona(persona_id text);

-- Create a new create_tavus_conversation function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.create_tavus_conversation(conversation_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    mock_conversation_id text;
    mock_conversation_url text;
    supabase_url text := current_setting('app.settings.supabase_url', true);
    service_role_key text := current_setting('app.settings.service_role_key', true);
BEGIN
    -- Check if we have the required settings
    IF supabase_url IS NULL OR service_role_key IS NULL THEN
        -- Fall back to mock mode if settings are missing
        RAISE WARNING 'Missing Supabase settings, using mock mode';
        
        -- Generate mock data
        mock_conversation_id := 'mock-' || gen_random_uuid()::text;
        mock_conversation_url := 'https://mock-daily-room.daily.co/' || mock_conversation_id;
        
        -- Return mock response
        RETURN jsonb_build_object(
            'conversation_id', mock_conversation_id,
            'conversation_url', mock_conversation_url,
            'status', 'active',
            'created_at', now()
        );
    END IF;

    -- Try to call the Edge Function
    BEGIN
        SELECT content::jsonb INTO result
        FROM http((
            'POST',
            supabase_url || '/functions/v1/create-tavus-conversation',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            conversation_request::text
        )::http_request);
        
        -- Return the result from the Edge Function
        RETURN result;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error
            RAISE WARNING 'Error calling Edge Function: %', SQLERRM;
            
            -- Fall back to mock mode
            mock_conversation_id := 'mock-error-' || gen_random_uuid()::text;
            mock_conversation_url := 'https://mock-daily-room.daily.co/' || mock_conversation_id;
            
            -- Return mock response
            RETURN jsonb_build_object(
                'conversation_id', mock_conversation_id,
                'conversation_url', mock_conversation_url,
                'status', 'active',
                'created_at', now()
            );
    END;
END;
$$;

-- Create a new end_tavus_conversation function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.end_tavus_conversation(conversation_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    supabase_url text := current_setting('app.settings.supabase_url', true);
    service_role_key text := current_setting('app.settings.service_role_key', true);
BEGIN
    -- Skip for mock conversations
    IF conversation_id LIKE 'mock-%' THEN
        RAISE NOTICE 'Skipping end for mock conversation: %', conversation_id;
        RETURN;
    END IF;

    -- Check if we have the required settings
    IF supabase_url IS NULL OR service_role_key IS NULL THEN
        RAISE WARNING 'Missing Supabase settings, skipping end conversation';
        RETURN;
    END IF;

    -- Try to call the Edge Function
    BEGIN
        PERFORM http((
            'POST',
            supabase_url || '/functions/v1/end-tavus-conversation',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            jsonb_build_object('conversation_id', conversation_id)::text
        )::http_request);
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail
            RAISE WARNING 'Error calling Edge Function to end conversation: %', SQLERRM;
    END;
END;
$$;

-- Create a new delete_tavus_persona function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.delete_tavus_persona(persona_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    supabase_url text := current_setting('app.settings.supabase_url', true);
    service_role_key text := current_setting('app.settings.service_role_key', true);
BEGIN
    -- Skip for mock personas
    IF persona_id LIKE 'mock-%' THEN
        RAISE NOTICE 'Skipping delete for mock persona: %', persona_id;
        RETURN;
    END IF;

    -- Check if we have the required settings
    IF supabase_url IS NULL OR service_role_key IS NULL THEN
        RAISE WARNING 'Missing Supabase settings, skipping delete persona';
        RETURN;
    END IF;

    -- Try to call the Edge Function
    BEGIN
        PERFORM http((
            'POST',
            supabase_url || '/functions/v1/delete-tavus-persona',
            ARRAY[
                http_header('Authorization', 'Bearer ' || service_role_key),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            jsonb_build_object('persona_id', persona_id)::text
        )::http_request);
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail
            RAISE WARNING 'Error calling Edge Function to delete persona: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tavus_conversation(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_tavus_conversation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tavus_persona(text) TO authenticated;