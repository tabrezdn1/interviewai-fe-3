/*
  # Add Prompt Generation Fields to Interviews Table
  
  1. New Columns
    - `prompt_status` - Tracks the status of LLM prompt generation (pending, generating, ready, failed)
    - `llm_generated_context` - Stores the generated conversational context for Tavus
    - `llm_generated_greeting` - Stores the generated custom greeting for Tavus
    
  2. Security
    - Maintains existing RLS policies
    
  3. Notes
    - These fields enable asynchronous prompt generation for interviews
    - Allows for better user experience by not blocking the UI during prompt generation
*/

-- Add prompt generation fields to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS prompt_status TEXT DEFAULT 'pending' CHECK (prompt_status IN ('pending', 'generating', 'ready', 'failed')),
ADD COLUMN IF NOT EXISTS llm_generated_context TEXT,
ADD COLUMN IF NOT EXISTS llm_generated_greeting TEXT,
ADD COLUMN IF NOT EXISTS prompt_error TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interviews_prompt_status ON interviews(prompt_status);

-- Create function to trigger prompt generation
CREATE OR REPLACE FUNCTION trigger_prompt_generation(
  p_interview_id UUID,
  p_interview_type TEXT,
  p_role TEXT,
  p_company TEXT,
  p_experience_level TEXT,
  p_difficulty_level TEXT,
  p_user_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update interview status to generating
  UPDATE interviews
  SET prompt_status = 'generating'
  WHERE id = p_interview_id;
  
  -- In a real implementation, this would invoke the Edge Function
  -- For now, we'll just return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;