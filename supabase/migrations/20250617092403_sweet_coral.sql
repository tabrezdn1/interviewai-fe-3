/*
  # Add Tavus Transcript and Analysis to Feedback Table
  
  1. New Columns
    - `transcript` - Stores the raw transcript from Tavus conversation
    - `tavus_analysis` - Stores the perception analysis from Tavus API
    
  2. Purpose
    - Provide transparency by showing users the raw data used for feedback
    - Allow users to see the actual conversation transcript
    - Display Tavus AI's perception analysis alongside our LLM analysis
    
  3. Notes
    - Both fields are nullable since they may not always be available
    - tavus_analysis is JSONB to store the structured perception_analysis data
*/

-- Add transcript and tavus_analysis columns to feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS tavus_analysis JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_has_transcript ON feedback((transcript IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_feedback_has_analysis ON feedback((tavus_analysis IS NOT NULL));