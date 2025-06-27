/*
  # Remove Questions and Interview Questions Tables
  
  1. Changes
    - Drop the interview_questions table
    - Drop the questions table
    - Add tavus_conversation_id to interviews table
    - Add feedback_processing_status to interviews table
    
  2. Purpose
    - Streamline database schema for dynamic question generation with OpenAI
    - Support feedback generation based on Tavus transcripts
    - Remove redundant tables that are no longer needed
    - Simplify the interview and feedback process
*/

-- Drop tables in the correct order to respect foreign key constraints
-- interview_questions depends on questions, so drop it first
DROP TABLE IF EXISTS interview_questions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- Add columns to interviews table to support Tavus integration
-- Only add these columns if they don't already exist
DO $$ 
BEGIN
    -- Add feedback_processing_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interviews' AND column_name = 'feedback_processing_status') THEN
        ALTER TABLE interviews 
        ADD COLUMN feedback_processing_status TEXT DEFAULT 'pending' 
        CHECK (feedback_processing_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
    
    -- Add tavus_conversation_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interviews' AND column_name = 'tavus_conversation_id') THEN
        ALTER TABLE interviews ADD COLUMN tavus_conversation_id TEXT;
    END IF;
    
    -- Add feedback_requested_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interviews' AND column_name = 'feedback_requested_at') THEN
        ALTER TABLE interviews ADD COLUMN feedback_requested_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create function to start feedback processing if it doesn't exist
CREATE OR REPLACE FUNCTION start_feedback_processing(
  p_interview_id UUID,
  p_tavus_conversation_id TEXT,
  p_callback_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update interviews table with processing status and conversation ID
  UPDATE interviews
  SET
    feedback_processing_status = 'processing',
    tavus_conversation_id = p_tavus_conversation_id,
    feedback_requested_at = NOW()
  WHERE id = p_interview_id;
  
  -- Insert or update feedback record with processing status
  INSERT INTO feedback (
    interview_id,
    overall_score,
    summary,
    strengths,
    improvements
  ) VALUES (
    p_interview_id,
    0,
    'Feedback is being processed. Please check back soon.',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
  )
  ON CONFLICT (interview_id) DO UPDATE SET
    summary = EXCLUDED.summary;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete feedback processing
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
) RETURNS BOOLEAN AS $$
DECLARE
  v_interview_id UUID;
BEGIN
  -- Get interview_id from tavus_conversation_id
  SELECT id INTO v_interview_id
  FROM interviews
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  IF v_interview_id IS NULL THEN
    RAISE EXCEPTION 'No interview found for Tavus conversation ID %', p_tavus_conversation_id;
  END IF;

  -- Update interviews table
  UPDATE interviews
  SET
    feedback_processing_status = 'completed'
  WHERE id = v_interview_id;

  -- Update feedback table
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
    experience_feedback
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
    p_experience_feedback
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
    experience_feedback = EXCLUDED.experience_feedback;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle feedback processing failures
CREATE OR REPLACE FUNCTION fail_feedback_processing(
  p_tavus_conversation_id TEXT,
  p_error_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_interview_id UUID;
BEGIN
  -- Get interview_id from tavus_conversation_id
  SELECT id INTO v_interview_id
  FROM interviews
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  IF v_interview_id IS NULL THEN
    RAISE EXCEPTION 'No interview found for Tavus conversation ID %', p_tavus_conversation_id;
  END IF;

  -- Update interviews table
  UPDATE interviews
  SET
    feedback_processing_status = 'failed'
  WHERE id = v_interview_id;

  -- Update feedback table with error
  INSERT INTO feedback (
    interview_id,
    overall_score,
    summary,
    strengths,
    improvements
  ) VALUES (
    v_interview_id,
    0,
    'Feedback generation failed: ' || p_error_message,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
  )
  ON CONFLICT (interview_id) DO UPDATE SET
    summary = EXCLUDED.summary;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interviews_tavus_conversation_id 
ON interviews(tavus_conversation_id);