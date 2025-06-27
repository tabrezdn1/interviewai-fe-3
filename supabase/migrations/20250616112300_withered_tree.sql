/*
  # Fix Tavus RPC Functions

  This migration fixes the PostgreSQL RPC functions for Tavus integration by:
  1. Ensuring pg_net extension is enabled
  2. Creating/updating the create_tavus_conversation function with correct pg_net usage
  3. Creating/updating the end_tavus_conversation function
  4. Creating/updating the delete_tavus_persona function

  The main issue was incorrect usage of HTTP headers in the pg_net.http_post function.
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_tavus_conversation(json);
DROP FUNCTION IF EXISTS end_tavus_conversation(text);
DROP FUNCTION IF EXISTS delete_tavus_persona(text);

-- Create the create_tavus_conversation function
CREATE OR REPLACE FUNCTION create_tavus_conversation(conversation_request json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  response_data text;
  response_status int;
BEGIN
  -- Make HTTP request to the edge function
  SELECT 
    content::text,
    status_code
  INTO 
    response_data,
    response_status
  FROM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/create-tavus-conversation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := conversation_request::text
  );

  -- Check if request was successful
  IF response_status != 200 THEN
    RAISE EXCEPTION 'Failed to create Tavus conversation: HTTP %', response_status;
  END IF;

  -- Parse and return the response
  result := response_data::json;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating Tavus conversation: %', SQLERRM;
END;
$$;

-- Create the end_tavus_conversation function
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
    body := json_build_object('conversation_id', conversation_id)::text
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

-- Create the delete_tavus_persona function
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
    body := json_build_object('persona_id', persona_id)::text
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
GRANT EXECUTE ON FUNCTION create_tavus_conversation(json) TO authenticated;
GRANT EXECUTE ON FUNCTION end_tavus_conversation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_tavus_persona(text) TO authenticated;