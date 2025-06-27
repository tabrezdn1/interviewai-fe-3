/*
  # Fix Tavus RPC Functions

  This migration creates the missing RPC functions that the frontend is trying to call:
  - create_tavus_conversation
  - end_tavus_conversation
  - delete_tavus_persona

  These functions will properly handle Tavus API calls through edge functions instead of
  trying to access non-existent schemas like 'supabase_auth_admin'.

  1. New Functions
    - `create_tavus_conversation` - Creates a Tavus conversation via edge function
    - `end_tavus_conversation` - Ends a Tavus conversation via edge function  
    - `delete_tavus_persona` - Deletes a Tavus persona via edge function

  2. Security
    - Functions are accessible to authenticated users
    - Proper error handling for API failures
*/

-- Function to create a Tavus conversation
CREATE OR REPLACE FUNCTION create_tavus_conversation(conversation_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  api_response jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Call the edge function to create the conversation
  SELECT 
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/create-tavus-conversation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := conversation_request
    ) INTO api_response;

  -- Check if the request was successful
  IF (api_response->>'status_code')::int >= 400 THEN
    RAISE EXCEPTION 'Failed to create Tavus conversation: %', api_response->>'body';
  END IF;

  -- Parse and return the response
  result := (api_response->>'body')::jsonb;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise with a user-friendly message
    RAISE EXCEPTION 'Error creating Tavus conversation: %', SQLERRM;
END;
$$;

-- Function to end a Tavus conversation
CREATE OR REPLACE FUNCTION end_tavus_conversation(conversation_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Call the edge function to end the conversation
  SELECT 
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/end-tavus-conversation',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('conversation_id', conversation_id)
    ) INTO api_response;

  -- Check if the request was successful
  IF (api_response->>'status_code')::int >= 400 THEN
    RAISE EXCEPTION 'Failed to end Tavus conversation: %', api_response->>'body';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise with a user-friendly message
    RAISE EXCEPTION 'Error ending Tavus conversation: %', SQLERRM;
END;
$$;

-- Function to delete a Tavus persona
CREATE OR REPLACE FUNCTION delete_tavus_persona(persona_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response jsonb;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Call the edge function to delete the persona
  SELECT 
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/delete-tavus-persona',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('persona_id', persona_id)
    ) INTO api_response;

  -- Check if the request was successful
  IF (api_response->>'status_code')::int >= 400 THEN
    RAISE EXCEPTION 'Failed to delete Tavus persona: %', api_response->>'body';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise with a user-friendly message
    RAISE EXCEPTION 'Error deleting Tavus persona: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_tavus_conversation(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION end_tavus_conversation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_tavus_persona(text) TO authenticated;