/*
  # Update Test Account Conversation Minutes
  
  1. Changes
    - Set total_conversation_minutes to 200 for testing purposes
    
  2. Purpose
    - Provide ample minutes for testing the interview functionality
    - Ensure test account has sufficient resources for multiple interviews
*/

-- Update all existing accounts to have 200 minutes for testing
UPDATE profiles 
SET total_conversation_minutes = 200 
WHERE total_conversation_minutes < 200;

-- Create a specific test account with 200 minutes if needed
-- This is commented out as we're updating all accounts above
-- If you need a specific test account, uncomment and modify this:
/*
INSERT INTO profiles (
  id, 
  name, 
  email_confirmed, 
  total_conversation_minutes, 
  used_conversation_minutes,
  subscription_tier
)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- replace with actual test user ID
  'Test Account',
  true,
  200,
  0,
  'professional'
)
ON CONFLICT (id) 
DO UPDATE SET 
  total_conversation_minutes = 200,
  subscription_tier = 'professional';
*/