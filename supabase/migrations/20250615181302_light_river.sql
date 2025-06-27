/*
  # Feedback Processing Schema
  
  1. New Columns
    - Add feedback processing status and Tavus conversation ID to interviews table
    - Add processing status and error handling to feedback table
    
  2. New Tables
    - feedback_processing_jobs - Track feedback processing jobs
    
  3. Functions
    - start_feedback_processing - Initialize feedback processing
    - complete_feedback_processing - Complete feedback processing with data
    - fail_feedback_processing - Handle failed feedback processing
    
  4. Security
    - Enable RLS on new tables
    - Add policies for user data access
*/

-- Add feedback processing status and Tavus conversation ID to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS feedback_processing_status TEXT DEFAULT 'pending' CHECK (feedback_processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS tavus_conversation_id TEXT,
ADD COLUMN IF NOT EXISTS feedback_requested_at TIMESTAMPTZ;

-- Add processing status and error message to feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

-- Create feedback_processing_jobs table
CREATE TABLE IF NOT EXISTS feedback_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE UNIQUE,
  tavus_conversation_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  callback_url TEXT NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for feedback_processing_jobs
ALTER TABLE feedback_processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_processing_jobs
CREATE POLICY "Users can view their own feedback processing jobs" ON feedback_processing_jobs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own feedback processing jobs" ON feedback_processing_jobs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own feedback processing jobs" ON feedback_processing_jobs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

-- Create function to start feedback processing
CREATE OR REPLACE FUNCTION start_feedback_processing(
  p_interview_id UUID,
  p_tavus_conversation_id TEXT,
  p_callback_url TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update interviews table
  UPDATE interviews
  SET
    feedback_processing_status = 'processing',
    tavus_conversation_id = p_tavus_conversation_id,
    feedback_requested_at = NOW()
  WHERE id = p_interview_id;

  -- Insert into feedback_processing_jobs
  INSERT INTO feedback_processing_jobs (
    interview_id,
    tavus_conversation_id,
    status,
    callback_url,
    started_at
  ) VALUES (
    p_interview_id,
    p_tavus_conversation_id,
    'in_progress',
    p_callback_url,
    NOW()
  );

  -- Update or insert into feedback table (if it exists, update status, else it will be created later)
  INSERT INTO feedback (interview_id, tavus_conversation_id, processing_status, processing_started_at, overall_score, summary)
  VALUES (p_interview_id, p_tavus_conversation_id, 'processing', NOW(), 0, 'Feedback is being processed.')
  ON CONFLICT (interview_id) DO UPDATE SET
    tavus_conversation_id = EXCLUDED.tavus_conversation_id,
    processing_status = EXCLUDED.processing_status,
    processing_started_at = EXCLUDED.processing_started_at,
    error_message = NULL; -- Clear any previous errors

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
  p_technical_score INTEGER,
  p_communication_score INTEGER,
  p_problem_solving_score INTEGER,
  p_experience_score INTEGER,
  p_technical_feedback TEXT,
  p_communication_feedback TEXT,
  p_problem_solving_feedback TEXT,
  p_experience_feedback TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_interview_id UUID;
BEGIN
  -- Get interview_id from feedback_processing_jobs
  SELECT interview_id INTO v_interview_id
  FROM feedback_processing_jobs
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  IF v_interview_id IS NULL THEN
    RAISE EXCEPTION 'No feedback processing job found for Tavus conversation ID %', p_tavus_conversation_id;
  END IF;

  -- Update feedback_processing_jobs
  UPDATE feedback_processing_jobs
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  -- Update interviews table
  UPDATE interviews
  SET
    feedback_processing_status = 'completed'
  WHERE id = v_interview_id;

  -- Update or insert into feedback table
  INSERT INTO feedback (
    interview_id,
    tavus_conversation_id,
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
    processing_status,
    processing_completed_at,
    error_message
  ) VALUES (
    v_interview_id,
    p_tavus_conversation_id,
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
    'completed',
    NOW(),
    NULL
  )
  ON CONFLICT (interview_id) DO UPDATE SET
    tavus_conversation_id = EXCLUDED.tavus_conversation_id,
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
    processing_status = EXCLUDED.processing_status,
    processing_completed_at = EXCLUDED.processing_completed_at,
    error_message = NULL;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to fail feedback processing
CREATE OR REPLACE FUNCTION fail_feedback_processing(
  p_tavus_conversation_id TEXT,
  p_error_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_interview_id UUID;
BEGIN
  -- Get interview_id from feedback_processing_jobs
  SELECT interview_id INTO v_interview_id
  FROM feedback_processing_jobs
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  IF v_interview_id IS NULL THEN
    RAISE EXCEPTION 'No feedback processing job found for Tavus conversation ID %', p_tavus_conversation_id;
  END IF;

  -- Update feedback_processing_jobs
  UPDATE feedback_processing_jobs
  SET
    status = 'failed',
    error_message = p_error_message,
    completed_at = NOW()
  WHERE tavus_conversation_id = p_tavus_conversation_id;

  -- Update interviews table
  UPDATE interviews
  SET
    feedback_processing_status = 'failed'
  WHERE id = v_interview_id;

  -- Update or insert into feedback table
  INSERT INTO feedback (
    interview_id,
    tavus_conversation_id,
    processing_status,
    processing_completed_at,
    error_message,
    overall_score, 
    summary
  ) VALUES (
    v_interview_id,
    p_tavus_conversation_id,
    'failed',
    NOW(),
    p_error_message,
    0, 
    'Feedback processing failed.'
  )
  ON CONFLICT (interview_id) DO UPDATE SET
    tavus_conversation_id = EXCLUDED.tavus_conversation_id,
    processing_status = EXCLUDED.processing_status,
    processing_completed_at = EXCLUDED.processing_completed_at,
    error_message = EXCLUDED.error_message;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;