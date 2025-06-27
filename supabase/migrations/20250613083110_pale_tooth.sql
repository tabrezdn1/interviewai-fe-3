/*
  # Add Tavus Conversation ID to Feedback Table
  
  1. New Columns
    - `tavus_conversation_id` - Stores the Tavus conversation ID for retrieving detailed data
    
  2. Purpose
    - Links feedback records to Tavus conversations
    - Enables fetching transcript, perception analysis, and other conversation data
    - Improves feedback quality with AI-generated insights
*/

-- Add tavus_conversation_id to feedback table
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS tavus_conversation_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_tavus_conversation_id 
ON feedback(tavus_conversation_id);