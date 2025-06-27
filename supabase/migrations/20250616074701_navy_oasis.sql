/*
  # Add LLM Prompt Cache Table
  
  1. New Table
    - `llm_prompt_cache` - Stores generated prompts for reuse
    
  2. Purpose
    - Provides persistent caching for LLM-generated interview prompts
    - Reduces redundant API calls to OpenAI
    - Improves performance and reduces costs
    
  3. Schema
    - Cache key fields: interview_type, role, company, experience_level, difficulty_level
    - Cache value fields: conversational_context, custom_greeting
    - Metadata: created_at, last_used_at, use_count
*/

-- Create the LLM prompt cache table
CREATE TABLE IF NOT EXISTS llm_prompt_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_type TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  conversational_context TEXT NOT NULL,
  custom_greeting TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  use_count INTEGER DEFAULT 1 NOT NULL,
  
  -- Create a unique constraint on the cache key fields
  UNIQUE(interview_type, role, company, experience_level, difficulty_level)
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_llm_prompt_cache_lookup 
ON llm_prompt_cache(interview_type, role, company, experience_level, difficulty_level);

-- Enable RLS
ALTER TABLE llm_prompt_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read from cache
CREATE POLICY "Authenticated users can read from prompt cache" 
ON llm_prompt_cache FOR SELECT 
TO authenticated 
USING (true);

-- Create function to get or create a cached prompt
CREATE OR REPLACE FUNCTION get_cached_prompt(
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT
) RETURNS TABLE (
  conversational_context TEXT,
  custom_greeting TEXT,
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
      v_cached_record.conversational_context,
      v_cached_record.custom_greeting,
      TRUE;
  ELSE
    -- Return NULL values with is_cached = FALSE
    RETURN QUERY
    SELECT 
      NULL::TEXT AS conversational_context,
      NULL::TEXT AS custom_greeting,
      FALSE AS is_cached;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to store a new prompt in the cache
CREATE OR REPLACE FUNCTION cache_prompt(
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT,
  p_conversational_context TEXT,
  p_custom_greeting TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO llm_prompt_cache (
    interview_type,
    role,
    company,
    experience_level,
    difficulty_level,
    conversational_context,
    custom_greeting
  ) VALUES (
    p_interview_type,
    p_role,
    p_company,
    p_experience_level,
    p_difficulty_level,
    p_conversational_context,
    p_custom_greeting
  )
  ON CONFLICT (interview_type, role, company, experience_level, difficulty_level) 
  DO UPDATE SET
    conversational_context = p_conversational_context,
    custom_greeting = p_custom_greeting,
    last_used_at = NOW(),
    use_count = llm_prompt_cache.use_count + 1;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;