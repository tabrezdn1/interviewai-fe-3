-- Drop the existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS update_conversation_minutes ON profiles;

-- Drop the function that was automatically updating minutes
DROP FUNCTION IF EXISTS handle_subscription_update() CASCADE;

-- Create a function to calculate carried over minutes
CREATE OR REPLACE FUNCTION calculate_carried_over_minutes(
  p_user_id UUID,
  p_new_plan_minutes INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_current_total INTEGER;
  v_current_used INTEGER;
  v_carried_over INTEGER;
BEGIN
  -- Get current minute values
  SELECT 
    total_conversation_minutes,
    used_conversation_minutes
  INTO 
    v_current_total,
    v_current_used
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate remaining minutes
  v_carried_over := GREATEST(0, v_current_total - v_current_used);
  
  -- Return the carried over minutes
  RETURN v_carried_over;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance webhook_logs table to include more detailed information
ALTER TABLE webhook_logs
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS minutes_before INTEGER,
ADD COLUMN IF NOT EXISTS minutes_after INTEGER,
ADD COLUMN IF NOT EXISTS carried_over_minutes INTEGER;

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);

-- Update the log_webhook_event function to include the new fields
CREATE OR REPLACE FUNCTION log_webhook_event(
  event_type TEXT,
  event_data JSONB,
  processing_result TEXT,
  user_id UUID DEFAULT NULL,
  subscription_id TEXT DEFAULT NULL,
  customer_id TEXT DEFAULT NULL,
  minutes_before INTEGER DEFAULT NULL,
  minutes_after INTEGER DEFAULT NULL,
  carried_over_minutes INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO webhook_logs (
    event_type,
    event_data,
    processing_result,
    user_id,
    subscription_id,
    customer_id,
    minutes_before,
    minutes_after,
    carried_over_minutes,
    created_at
  ) VALUES (
    event_type,
    event_data,
    processing_result,
    user_id,
    subscription_id,
    customer_id,
    minutes_before,
    minutes_after,
    carried_over_minutes,
    NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, we don't want to fail the whole webhook
    RAISE WARNING 'Failed to log webhook event: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_carried_over_minutes(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_webhook_event(TEXT, JSONB, TEXT, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;