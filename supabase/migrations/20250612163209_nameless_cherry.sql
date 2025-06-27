/*
  # Stripe Billing Integration Schema
  
  1. New Tables
    - `subscriptions` - User subscription data from Stripe
    - `payment_methods` - User payment methods from Stripe
    - `invoices` - Billing history and invoice data
    - `subscription_plans` - Available subscription plans
    - `usage_tracking` - Track conversation minutes usage
    
  2. Updates to Existing Tables
    - Add Stripe customer ID to profiles
    - Add subscription status fields
    
  3. Security
    - Enable RLS on all new tables
    - Add policies for user data access
*/

-- Add Stripe fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS current_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'unpaid')),
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY, -- Stripe price ID
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  interval_type TEXT NOT NULL CHECK (interval_type IN ('month', 'year')),
  conversation_minutes INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY, -- Stripe payment method ID
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.
  card_brand TEXT, -- 'visa', 'mastercard', etc.
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, -- Stripe invoice ID
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id),
  stripe_customer_id TEXT NOT NULL,
  amount_paid INTEGER NOT NULL, -- Amount in cents
  amount_due INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description TEXT,
  invoice_pdf TEXT, -- URL to PDF
  hosted_invoice_url TEXT, -- Stripe hosted invoice URL
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id),
  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  minutes_used INTEGER NOT NULL,
  usage_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Subscription plans - readable by all authenticated users
CREATE POLICY "Subscription plans are viewable by authenticated users" ON subscription_plans
  FOR SELECT TO authenticated USING (true);

-- Subscriptions - users can access their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Payment methods - users can access their own payment methods
CREATE POLICY "Users can view their own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Invoices - users can access their own invoices
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage tracking - users can access their own usage data
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_billing_period ON usage_tracking(user_id, billing_period_start, billing_period_end);

-- Functions for subscription management

-- Function to update user subscription status
CREATE OR REPLACE FUNCTION update_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profiles table with current subscription info
  UPDATE profiles 
  SET 
    current_subscription_id = NEW.id,
    subscription_status = NEW.status,
    subscription_current_period_start = NEW.current_period_start,
    subscription_current_period_end = NEW.current_period_end,
    subscription_cancel_at_period_end = NEW.cancel_at_period_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profiles when subscription changes
CREATE TRIGGER update_profile_subscription
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscription_status();

-- Function to track conversation minutes usage
CREATE OR REPLACE FUNCTION track_conversation_usage(
  p_user_id UUID,
  p_interview_id UUID,
  p_minutes_used INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id TEXT;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get current subscription info
  SELECT 
    current_subscription_id,
    subscription_current_period_start,
    subscription_current_period_end
  INTO 
    v_subscription_id,
    v_period_start,
    v_period_end
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Insert usage tracking record
  INSERT INTO usage_tracking (
    user_id,
    subscription_id,
    interview_id,
    minutes_used,
    billing_period_start,
    billing_period_end
  ) VALUES (
    p_user_id,
    v_subscription_id,
    p_interview_id,
    p_minutes_used,
    COALESCE(v_period_start, DATE_TRUNC('month', NOW())),
    COALESCE(v_period_end, DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
  );
  
  -- Update used conversation minutes in profiles
  UPDATE profiles 
  SET used_conversation_minutes = used_conversation_minutes + p_minutes_used
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current billing period usage
CREATE OR REPLACE FUNCTION get_current_period_usage(p_user_id UUID)
RETURNS TABLE (
  total_minutes_used INTEGER,
  total_minutes_available INTEGER,
  minutes_remaining INTEGER,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ut.minutes_used), 0)::INTEGER as total_minutes_used,
    p.total_conversation_minutes,
    (p.total_conversation_minutes - COALESCE(SUM(ut.minutes_used), 0))::INTEGER as minutes_remaining,
    p.subscription_current_period_start,
    p.subscription_current_period_end
  FROM profiles p
  LEFT JOIN usage_tracking ut ON (
    ut.user_id = p.id 
    AND ut.billing_period_start = p.subscription_current_period_start
    AND ut.billing_period_end = p.subscription_current_period_end
  )
  WHERE p.id = p_user_id
  GROUP BY 
    p.total_conversation_minutes,
    p.subscription_current_period_start,
    p.subscription_current_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;