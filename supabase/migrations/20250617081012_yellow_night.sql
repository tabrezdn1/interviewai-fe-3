/*
  # Add Feedback Processing Status to Interviews Table
  
  1. New Columns
    - Ensure feedback_processing_status exists on interviews table
    - Add index for faster lookups
    
  2. Purpose
    - Track the status of feedback generation
    - Support retry functionality for failed feedback
    - Improve user experience with feedback status indicators
*/

-- Add feedback_processing_status to interviews table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interviews' AND column_name = 'feedback_processing_status') THEN
        ALTER TABLE interviews 
        ADD COLUMN feedback_processing_status TEXT DEFAULT 'pending' 
        CHECK (feedback_processing_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- Create index for faster lookups if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_interviews_feedback_processing_status') THEN
        CREATE INDEX idx_interviews_feedback_processing_status ON interviews(feedback_processing_status);
    END IF;
END $$;

-- Update existing completed interviews to have completed feedback status
UPDATE interviews
SET feedback_processing_status = 'completed'
WHERE status = 'completed' 
AND feedback_processing_status IS NULL;