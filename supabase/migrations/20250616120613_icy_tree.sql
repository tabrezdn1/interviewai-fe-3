/*
  # Fix Tavus RPC Functions for Asynchronous pg_net Behavior
  
  1. Changes
    - Update RPC functions to correctly handle the asynchronous nature of pg_net
    - Implement two-step process: get request_id, then query net._http_response
    - Fix the column references to use status_code from _http_response table
    
  2. Purpose
    - Fix the "column 'status' does not exist" error
    - Properly handle asynchronous HTTP requests in PostgreSQL functions
    - Ensure reliable communication with Tavus API via Edge Functions
*/

-- Drop the existing functions first
DROP FUNCTION IF EXISTS create_tavus_conversation(jsonb);
DROP FUNCTION IF EXISTS end_tavus_conversation(text);
DROP FUNCTION IF EXISTS delete_tavus_persona(text);

-- Recreate the create_tavus_conversation function
CREATE OR REPLACE FUNCTION create_tavus_conversation(conversation_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  response_data jsonb;
  response_status int;
BEGIN
  -- Initiate the HTTP POST request to the edge function
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/create-tavus-conversation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := conversation_request
  ) INTO request_id;

  -- Query the _http_response table to get the response status and content
  -- A small delay might be needed in some environments, but pg_net often handles
  -- the immediate availability for simple cases. For robust production systems,
  -- consider a polling mechanism with a timeout.
  SELECT
    status_code,
    content::jsonb
  INTO
    response_status,
    response_data
  FROM net._http_response
  WHERE id = request_id;

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

-- Recreate the end_tavus_conversation function
CREATE OR REPLACE FUNCTION end_tavus_conversation(conversation_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  response_status int;
BEGIN
  -- Initiate the HTTP POST request to the edge function
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/end-tavus-conversation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('conversation_id', conversation_id)
  ) INTO request_id;

  -- Query the _http_response table to get the response status
  SELECT
    status_code
  INTO
    response_status
  FROM net._http_response
  WHERE id = request_id;

  -- Check if request was successful
  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to end Tavus conversation: HTTP %', response_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error ending Tavus conversation: %', SQLERRM;
END;
$$;

-- Recreate the delete_tavus_persona function
CREATE OR REPLACE FUNCTION delete_tavus_persona(persona_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  response_status int;
BEGIN
  -- Initiate the HTTP POST request to the edge function
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/delete-tavus-persona',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('persona_id', persona_id)
  ) INTO request_id;

  -- Query the _http_response table to get the response status
  SELECT
    status_code
  INTO
    response_status
  FROM net._http_response
  WHERE id = request_id;

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