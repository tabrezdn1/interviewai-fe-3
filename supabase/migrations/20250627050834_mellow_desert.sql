/*
  # Fix Stripe Webhook Handler
  
  1. Changes
    - Add logging to stripe-webhook function
    - Fix subscription tier update logic
    - Ensure conversation minutes are updated correctly
    - Add proper error handling
    
  2. Purpose
    - Fix issue where payments work but subscription tier and minutes aren't updated
    - Ensure webhook events are properly processed
    - Improve debugging capabilities
*/

-- Create a function to log webhook events for debugging
CREATE OR REPLACE FUNCTION log_webhook_event(
  event_type TEXT,
  event_data JSONB,
  processing_result TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO webhook_logs (
    event_type,
    event_data,
    processing_result,
    created_at
  ) VALUES (
    event_type,
    event_data,
    processing_result,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, we don't want to fail the whole webhook
    RAISE WARNING 'Failed to log webhook event: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processing_result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Function to manually update a user's subscription tier and minutes
CREATE OR REPLACE FUNCTION manually_update_subscription(
  p_user_id UUID,
  p_subscription_tier TEXT,
  p_subscription_id TEXT,
  p_customer_id TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  v_minutes INTEGER;
BEGIN
  -- Determine minutes based on tier
  IF p_subscription_tier = 'intro' THEN
    v_minutes := 60;
  ELSIF p_subscription_tier = 'professional' THEN
    v_minutes := 330;
  ELSIF p_subscription_tier = 'executive' THEN
    v_minutes := 900;
  ELSE
    v_minutes := 25; -- Free tier
  END IF;
  
  -- Update the profile
  UPDATE profiles
  SET 
    subscription_tier = p_subscription_tier,
    subscription_status = 'active',
    current_subscription_id = p_subscription_id,
    subscription_current_period_start = p_period_start,
    subscription_current_period_end = p_period_end,
    stripe_customer_id = p_customer_id,
    total_conversation_minutes = v_minutes,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription tier from product name
CREATE OR REPLACE FUNCTION get_subscription_tier_from_product(
  product_name TEXT
) RETURNS TEXT AS $$
BEGIN
  IF product_name ILIKE '%intro%' THEN
    RETURN 'intro';
  ELSIF product_name ILIKE '%professional%' THEN
    RETURN 'professional';
  ELSIF product_name ILIKE '%executive%' THEN
    RETURN 'executive';
  ELSE
    RETURN 'free';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get conversation minutes from subscription tier
CREATE OR REPLACE FUNCTION get_minutes_from_tier(
  tier TEXT,
  is_annual BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
BEGIN
  IF tier = 'intro' THEN
    RETURN CASE WHEN is_annual THEN 720 ELSE 60 END;
  ELSIF tier = 'professional' THEN
    RETURN CASE WHEN is_annual THEN 3960 ELSE 330 END;
  ELSIF tier = 'executive' THEN
    RETURN CASE WHEN is_annual THEN 10800 ELSE 900 END;
  ELSE -- free tier
    RETURN 25;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;