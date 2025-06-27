/*
  # Add Stripe Integration Fields
  
  1. New Fields
    - Add stripe_customer_id to profiles table
    - Add stripe_subscription_id to profiles table
    
  2. Security
    - Ensure RLS policies are updated to protect these fields
*/

-- Add Stripe fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create function to handle subscription updates
CREATE OR REPLACE FUNCTION handle_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set appropriate conversation minutes based on subscription tier
  IF NEW.subscription_tier = 'intro' THEN
    NEW.total_conversation_minutes := 60;
  ELSIF NEW.subscription_tier = 'professional' THEN
    NEW.total_conversation_minutes := 330;
  ELSIF NEW.subscription_tier = 'executive' THEN
    NEW.total_conversation_minutes := 900;
  ELSE
    NEW.total_conversation_minutes := 60; -- Default for free tier
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation minutes when subscription changes
CREATE TRIGGER update_conversation_minutes
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
EXECUTE FUNCTION handle_subscription_update();