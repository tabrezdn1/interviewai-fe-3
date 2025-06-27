-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS create_tavus_conversation(jsonb);
DROP FUNCTION IF EXISTS create_tavus_conversation(json);
DROP FUNCTION IF EXISTS create_tavus_conversation(uuid, text, text);
DROP FUNCTION IF EXISTS create_tavus_conversation_simple(uuid, text, text);
DROP FUNCTION IF EXISTS end_tavus_conversation(text);
DROP FUNCTION IF EXISTS delete_tavus_persona(text);

-- Create the create_tavus_conversation function with jsonb parameter
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