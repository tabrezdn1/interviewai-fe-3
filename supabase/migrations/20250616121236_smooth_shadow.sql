/*
  # Fix Tavus RPC Functions
  
  1. Changes
    - Drop existing functions first to avoid return type conflicts
    - Recreate functions with proper return types and parameters
    - Fix HTTP request handling in create_tavus_conversation
    - Enable HTTP extension for database functions
    
  2. Purpose
    - Fix "unrecognized configuration parameter app.settings.supabase_url" error
    - Ensure proper communication between database and Edge Functions
    - Maintain consistent function behavior across all Tavus integration
*/

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS complete_feedback_processing(text,integer,text,text[],text[],integer,integer,integer,integer,text,text,text,text);
DROP FUNCTION IF EXISTS fail_feedback_processing(text,text);
DROP FUNCTION IF EXISTS get_cached_prompt(text,text,text,text,text);
DROP FUNCTION IF EXISTS cache_prompt(text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS create_tavus_conversation(jsonb);
DROP FUNCTION IF EXISTS create_tavus_conversation(json);
DROP FUNCTION IF EXISTS create_tavus_conversation(uuid,text,text,text);

-- Function to create Tavus conversation
CREATE OR REPLACE FUNCTION create_tavus_conversation(
  conversation_request JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_response JSON;
  v_supabase_url TEXT := 'https://klzhnngxriswlaxsstzb.supabase.co';
  v_service_role_key TEXT := current_setting('supabase.service_role_key', true);
BEGIN
  -- Call the Edge Function to create the conversation
  SELECT content::json INTO v_response
  FROM http((
    'POST',
    v_supabase_url || '/functions/v1/create-tavus-conversation',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    conversation_request::text
  ));

  -- Check if the response is successful
  IF v_response IS NULL THEN
    RAISE EXCEPTION 'Failed to create Tavus conversation: No response from Edge Function';
  END IF;

  RETURN v_response;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating Tavus conversation: %', SQLERRM;
END;
$$;

-- Function to complete feedback processing
CREATE OR REPLACE FUNCTION complete_feedback_processing(
  p_tavus_conversation_id TEXT,
  p_overall_score INTEGER,
  p_summary TEXT,
  p_strengths TEXT[],
  p_improvements TEXT[],
  p_technical_score INTEGER DEFAULT NULL,
  p_communication_score INTEGER DEFAULT NULL,
  p_problem_solving_score INTEGER DEFAULT NULL,
  p_experience_score INTEGER DEFAULT NULL,
  p_technical_feedback TEXT DEFAULT NULL,
  p_communication_feedback TEXT DEFAULT NULL,
  p_problem_solving_feedback TEXT DEFAULT NULL,
  p_experience_feedback TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interview_id UUID;
BEGIN
  -- Find the interview by conversation ID
  SELECT id INTO v_interview_id
  FROM interviews
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  IF v_interview_id IS NULL THEN
    RAISE EXCEPTION 'Interview not found for conversation ID: %', p_tavus_conversation_id;
  END IF;

  -- Update interview status
  UPDATE interviews
  SET 
    status = 'completed',
    completed_at = NOW(),
    feedback_processing_status = 'completed',
    score = p_overall_score
  WHERE id = v_interview_id;

  -- Insert or update feedback
  INSERT INTO feedback (
    interview_id,
    overall_score,
    summary,
    strengths,
    improvements,
    technical_score,
    communication_score,
    problem_solving_score,
    experience_score,
    technical_feedback,
    communication_feedback,
    problem_solving_feedback,
    experience_feedback,
    tavus_conversation_id
  ) VALUES (
    v_interview_id,
    p_overall_score,
    p_summary,
    p_strengths,
    p_improvements,
    p_technical_score,
    p_communication_score,
    p_problem_solving_score,
    p_experience_score,
    p_technical_feedback,
    p_communication_feedback,
    p_problem_solving_feedback,
    p_experience_feedback,
    p_tavus_conversation_id
  )
  ON CONFLICT (interview_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    summary = EXCLUDED.summary,
    strengths = EXCLUDED.strengths,
    improvements = EXCLUDED.improvements,
    technical_score = EXCLUDED.technical_score,
    communication_score = EXCLUDED.communication_score,
    problem_solving_score = EXCLUDED.problem_solving_score,
    experience_score = EXCLUDED.experience_score,
    technical_feedback = EXCLUDED.technical_feedback,
    communication_feedback = EXCLUDED.communication_feedback,
    problem_solving_feedback = EXCLUDED.problem_solving_feedback,
    experience_feedback = EXCLUDED.experience_feedback,
    tavus_conversation_id = EXCLUDED.tavus_conversation_id;

  -- Update or delete feedback processing job
  UPDATE feedback_processing_jobs
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE tavus_conversation_id = p_tavus_conversation_id;
  
  RETURN TRUE;
END;
$$;

-- Function to fail feedback processing
CREATE OR REPLACE FUNCTION fail_feedback_processing(
  p_tavus_conversation_id TEXT,
  p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interview_id UUID;
BEGIN
  -- Find the interview by conversation ID
  SELECT id INTO v_interview_id
  FROM interviews
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  IF v_interview_id IS NULL THEN
    RAISE EXCEPTION 'Interview not found for conversation ID: %', p_tavus_conversation_id;
  END IF;

  -- Update interview status
  UPDATE interviews
  SET feedback_processing_status = 'failed'
  WHERE id = v_interview_id;

  -- Update feedback processing job
  UPDATE feedback_processing_jobs
  SET 
    status = 'failed',
    error_message = p_error_message,
    completed_at = NOW()
  WHERE tavus_conversation_id = p_tavus_conversation_id;
  
  RETURN TRUE;
END;
$$;

-- Function to get cached prompt
CREATE OR REPLACE FUNCTION get_cached_prompt(
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT
)
RETURNS TABLE(
  system_prompt TEXT,
  initial_message TEXT,
  persona_name TEXT,
  persona_description TEXT,
  is_cached BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lpc.system_prompt,
    lpc.initial_message,
    lpc.persona_name,
    lpc.persona_description,
    TRUE as is_cached
  FROM llm_prompt_cache lpc
  WHERE 
    lpc.interview_type = p_interview_type
    AND lpc.role = p_role
    AND lpc.company = p_company
    AND lpc.experience_level = p_experience_level
    AND lpc.difficulty_level = p_difficulty_level;

  -- If no rows found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
  END IF;
END;
$$;

-- Function to cache prompt
CREATE OR REPLACE FUNCTION cache_prompt(
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT,
  p_system_prompt TEXT,
  p_initial_message TEXT,
  p_persona_name TEXT DEFAULT NULL,
  p_persona_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO llm_prompt_cache (
    interview_type,
    role,
    company,
    experience_level,
    difficulty_level,
    system_prompt,
    initial_message,
    persona_name,
    persona_description,
    use_count,
    last_used_at
  ) VALUES (
    p_interview_type,
    p_role,
    p_company,
    p_experience_level,
    p_difficulty_level,
    p_system_prompt,
    p_initial_message,
    p_persona_name,
    p_persona_description,
    1,
    NOW()
  )
  ON CONFLICT (interview_type, role, company, experience_level, difficulty_level)
  DO UPDATE SET
    system_prompt = p_system_prompt,
    initial_message = p_initial_message,
    persona_name = p_persona_name,
    persona_description = p_persona_description,
    use_count = llm_prompt_cache.use_count + 1,
    last_used_at = NOW();
    
  RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_tavus_conversation(json) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_feedback_processing(text,integer,text,text[],text[],integer,integer,integer,integer,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION fail_feedback_processing(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_prompt(text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION cache_prompt(text,text,text,text,text,text,text,text,text) TO authenticated;