/*
  # Update LLM Prompt Cache Schema for Persona Support
  
  1. Changes
    - Rename columns in llm_prompt_cache table to match Tavus API terminology
    - Add persona fields to llm_prompt_cache table
    - Add tavus_persona_id to interviews table
    - Update functions to support the new schema
    
  2. Purpose
    - Better align with Tavus API terminology
    - Support creating and caching custom personas
    - Enable more sophisticated AI interviewer behavior
*/

-- Update llm_prompt_cache table to support persona data
ALTER TABLE llm_prompt_cache
RENAME COLUMN conversational_context TO system_prompt;

ALTER TABLE llm_prompt_cache
RENAME COLUMN custom_greeting TO initial_message;

ALTER TABLE llm_prompt_cache
ADD COLUMN IF NOT EXISTS persona_name TEXT,
ADD COLUMN IF NOT EXISTS persona_description TEXT;

-- Add tavus_persona_id to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS tavus_persona_id TEXT;

-- Drop existing functions to recreate with new return types
DROP FUNCTION IF EXISTS get_cached_prompt(text, text, text, text, text);
DROP FUNCTION IF EXISTS cache_prompt(text, text, text, text, text, text, text);

-- Create updated get_cached_prompt function with new return type
CREATE OR REPLACE FUNCTION get_cached_prompt(
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT
) RETURNS TABLE (
  system_prompt TEXT,
  initial_message TEXT,
  persona_name TEXT,
  persona_description TEXT,
  is_cached BOOLEAN
) AS $$
DECLARE
  v_cached_record llm_prompt_cache%ROWTYPE;
BEGIN
  -- Try to find an existing cached prompt
  SELECT * INTO v_cached_record
  FROM llm_prompt_cache
  WHERE 
    interview_type = p_interview_type AND
    role = p_role AND
    company = p_company AND
    experience_level = p_experience_level AND
    difficulty_level = p_difficulty_level;
    
  -- If found, update usage stats and return it
  IF FOUND THEN
    UPDATE llm_prompt_cache
    SET 
      last_used_at = NOW(),
      use_count = use_count + 1
    WHERE id = v_cached_record.id;
    
    RETURN QUERY
    SELECT 
      v_cached_record.system_prompt,
      v_cached_record.initial_message,
      v_cached_record.persona_name,
      v_cached_record.persona_description,
      TRUE;
  ELSE
    -- Return NULL values with is_cached = FALSE
    RETURN QUERY
    SELECT 
      NULL::TEXT AS system_prompt,
      NULL::TEXT AS initial_message,
      NULL::TEXT AS persona_name,
      NULL::TEXT AS persona_description,
      FALSE AS is_cached;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated cache_prompt function to handle the new fields
CREATE OR REPLACE FUNCTION cache_prompt(
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT,
  p_system_prompt TEXT,
  p_initial_message TEXT,
  p_persona_name TEXT,
  p_persona_description TEXT
) RETURNS BOOLEAN AS $$
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
    persona_description
  ) VALUES (
    p_interview_type,
    p_role,
    p_company,
    p_experience_level,
    p_difficulty_level,
    p_system_prompt,
    p_initial_message,
    p_persona_name,
    p_persona_description
  )
  ON CONFLICT (interview_type, role, company, experience_level, difficulty_level) 
  DO UPDATE SET
    system_prompt = p_system_prompt,
    initial_message = p_initial_message,
    persona_name = p_persona_name,
    persona_description = p_persona_description,
    last_used_at = NOW(),
    use_count = llm_prompt_cache.use_count + 1;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for tavus_persona_id
CREATE INDEX IF NOT EXISTS idx_interviews_tavus_persona_id ON interviews(tavus_persona_id);