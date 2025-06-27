/*
  # Fix create_tavus_conversation RPC function

  1. Changes
    - Update the `create_tavus_conversation` function to use correct column name `status` instead of `status_code`
    - The `net.http_post` function returns `status` not `status_code`

  2. Security
    - No changes to RLS or policies
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS create_tavus_conversation(jsonb);

-- Recreate the function with the correct column name
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
    status,
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