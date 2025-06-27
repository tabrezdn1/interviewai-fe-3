/*
  # Add Webhook Logging Function
  
  1. New Table
    - `webhook_logs` - Stores webhook event data for debugging
    
  2. New Function
    - `log_webhook_event` - Logs webhook events to the webhook_logs table
    
  3. Purpose
    - Provide better debugging for Stripe webhook events
    - Track webhook processing results
    - Help diagnose issues with payment processing
*/

-- Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processing_result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION log_webhook_event(TEXT, JSONB, TEXT) TO authenticated;