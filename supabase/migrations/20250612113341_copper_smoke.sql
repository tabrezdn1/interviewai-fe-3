/*
  # Update Test Account Conversation Minutes
  
  1. Changes
    - Set default conversation minutes to 20 for all new users
    - Update test@test.com account to have 200 conversation minutes
    - Reset all other accounts to 20 minutes
    
  2. Notes
    - This ensures only the test account has 200 minutes
    - All other accounts have the standard 20 minutes
*/

-- First, update the default value for new accounts
ALTER TABLE profiles 
ALTER COLUMN total_conversation_minutes SET DEFAULT 20;

-- Reset all accounts to 20 minutes
UPDATE profiles 
SET total_conversation_minutes = 20;

-- Update the test account to have 200 minutes
UPDATE profiles 
SET total_conversation_minutes = 200
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'test@test.com';

-- Reset used minutes for all accounts for testing
UPDATE profiles
SET used_conversation_minutes = 0
WHERE used_conversation_minutes > 0;