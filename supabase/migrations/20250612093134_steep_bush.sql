/*
  # Add Conversation Limits to Profiles
  
  1. New Columns
    - total_conversation_minutes - Total minutes available based on subscription
    - used_conversation_minutes - Minutes consumed by user
    
  2. Updates
    - Add minute tracking to profiles table
    - Update existing users with default values
*/

-- Add conversation minute tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_conversation_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS used_conversation_minutes INTEGER DEFAULT 0;

-- Update existing users with default intro plan minutes (60 minutes)
UPDATE profiles 
SET total_conversation_minutes = 60, used_conversation_minutes = 0 
WHERE total_conversation_minutes IS NULL;

-- Add check constraints
ALTER TABLE profiles 
ADD CONSTRAINT check_total_minutes_positive CHECK (total_conversation_minutes >= 0),
ADD CONSTRAINT check_used_minutes_positive CHECK (used_conversation_minutes >= 0),
ADD CONSTRAINT check_used_not_exceed_total CHECK (used_conversation_minutes <= total_conversation_minutes);

-- Create function to update conversation minutes
CREATE OR REPLACE FUNCTION update_conversation_minutes(
  user_id UUID,
  minutes_to_add INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET used_conversation_minutes = used_conversation_minutes + minutes_to_add
  WHERE id = user_id 
  AND (used_conversation_minutes + minutes_to_add) <= total_conversation_minutes;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set total conversation minutes (for subscription changes)
CREATE OR REPLACE FUNCTION set_total_conversation_minutes(
  user_id UUID,
  new_total INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET total_conversation_minutes = new_total
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;