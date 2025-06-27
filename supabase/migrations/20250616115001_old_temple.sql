/*
  # Fix RPC Functions to Use status_code Instead of status
  
  1. Changes
    - Drop existing RPC functions
    - Recreate them using status_code instead of status for pg_net.http_post results
    - Maintain the same functionality and error handling
    
  2. Purpose
    - Fix the error "column 'status' does not exist" in RPC functions
    - Ensure proper handling of HTTP responses from Tavus API
    - Maintain consistent behavior across all Tavus integration functions
*/

-- Drop the existing functions first
DROP FUNCTION IF EXISTS create_tavus_conversation(jsonb);
DROP FUNCTION IF EXISTS end_tavus_conversation(text);
DROP FUNCTION IF EXISTS delete_tavus_persona(text);

-- Recreate the create_tavus_conversation function with the correct column name (status_code)
CREATE OR REPLACE FUNCTION create_tavus_conversation(conversation_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  response_data jsonb;
  response_status int;
BEGIN
  -- Make HTTP request to the edge function
  SELECT 
    status_code,
    content::jsonb
  INTO 
    response_status,
    response_data
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/create-tavus-conversation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := conversation_request
  );

  -- Check if request was successful
  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to create Tavus conversation: HTTP %', response_status;
  END IF;

  -- Return the response
  RETURN response_data;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating Tavus conversation: %', SQLERRM;
END;
$$;

-- Recreate the end_tavus_conversation function with the correct column name (status_code)
CREATE OR REPLACE FUNCTION end_tavus_conversation(conversation_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status int;
BEGIN
  -- Make HTTP request to the edge function
  SELECT 
    status_code
  INTO 
    response_status
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/end-tavus-conversation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('conversation_id', conversation_id)
  );

  -- Check if request was successful
  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to end Tavus conversation: HTTP %', response_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error ending Tavus conversation: %', SQLERRM;
END;
$$;

-- Recreate the delete_tavus_persona function with the correct column name (status_code)
CREATE OR REPLACE FUNCTION delete_tavus_persona(persona_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status int;
BEGIN
  -- Make HTTP request to the edge function
  SELECT 
    status_code
  INTO 
    response_status
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/delete-tavus-persona',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('persona_id', persona_id)
  );

  -- Check if request was successful
  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to delete Tavus persona: HTTP %', response_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting Tavus persona: %', SQLERRM;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_tavus_conversation(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION end_tavus_conversation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_tavus_persona(text) TO authenticated;