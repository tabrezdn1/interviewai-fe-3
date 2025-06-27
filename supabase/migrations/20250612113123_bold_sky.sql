/*
  # Update Test Account with 200 Conversation Minutes
  
  1. Changes
    - Updates all accounts to have 200 conversation minutes for testing
    - Ensures test accounts have sufficient minutes for demos
    
  2. Notes
    - This is for testing purposes only
    - In production, minutes would be based on subscription tier
*/

-- Update all existing accounts to have 200 minutes for testing
UPDATE profiles 
SET total_conversation_minutes = 200 
WHERE total_conversation_minutes < 200;

-- Reset used minutes for testing
UPDATE profiles
SET used_conversation_minutes = 0
WHERE used_conversation_minutes > 0;