-- First, fix the issue with used_conversation_minutes exceeding total_conversation_minutes
-- Reset used_conversation_minutes for users where it exceeds the total
UPDATE profiles 
SET used_conversation_minutes = 0
WHERE used_conversation_minutes > total_conversation_minutes;

-- Add Stripe fields to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS current_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'unpaid')),
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;

-- Update subscription_tier check constraint to include all tiers
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'intro', 'professional', 'executive'));

-- Update default total_conversation_minutes for free tier to 25
ALTER TABLE profiles 
ALTER COLUMN total_conversation_minutes SET DEFAULT 25;

-- Update existing free tier users to have 25 minutes
-- But ONLY if their current total is LESS than 25 (to avoid reducing minutes for users with more)
UPDATE profiles 
SET total_conversation_minutes = 25 
WHERE subscription_tier = 'free' AND total_conversation_minutes < 25;

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

-- Enable RLS on new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Check if they exist before creating
DO $policy_check$
BEGIN
    -- Subscription plans policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_plans' 
        AND policyname = 'Subscription plans are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Subscription plans are viewable by authenticated users" ON subscription_plans
        FOR SELECT TO authenticated USING (true);
    END IF;

    -- Subscriptions policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' 
        AND policyname = 'Users can view their own subscriptions'
    ) THEN
        CREATE POLICY "Users can view their own subscriptions" ON subscriptions
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' 
        AND policyname = 'Users can insert their own subscriptions'
    ) THEN
        CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' 
        AND policyname = 'Users can update their own subscriptions'
    ) THEN
        CREATE POLICY "Users can update their own subscriptions" ON subscriptions
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Payment methods policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_methods' 
        AND policyname = 'Users can view their own payment methods'
    ) THEN
        CREATE POLICY "Users can view their own payment methods" ON payment_methods
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_methods' 
        AND policyname = 'Users can insert their own payment methods'
    ) THEN
        CREATE POLICY "Users can insert their own payment methods" ON payment_methods
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_methods' 
        AND policyname = 'Users can update their own payment methods'
    ) THEN
        CREATE POLICY "Users can update their own payment methods" ON payment_methods
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_methods' 
        AND policyname = 'Users can delete their own payment methods'
    ) THEN
        CREATE POLICY "Users can delete their own payment methods" ON payment_methods
        FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Invoices policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' 
        AND policyname = 'Users can view their own invoices'
    ) THEN
        CREATE POLICY "Users can view their own invoices" ON invoices
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices' 
        AND policyname = 'Users can insert their own invoices'
    ) THEN
        CREATE POLICY "Users can insert their own invoices" ON invoices
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $policy_check$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_user_subscription_status() CASCADE;

-- Create the function to update user subscription status
CREATE FUNCTION update_user_subscription_status()
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

-- Create trigger to update profiles when subscription changes
DROP TRIGGER IF EXISTS update_profile_subscription ON subscriptions;
CREATE TRIGGER update_profile_subscription
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscription_status();

-- Drop the function if it exists
DROP FUNCTION IF EXISTS handle_subscription_update() CASCADE;

-- Create the function to handle subscription updates
CREATE FUNCTION handle_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set appropriate conversation minutes based on subscription tier
  IF NEW.subscription_tier = 'free' THEN
    NEW.total_conversation_minutes := 25;
  ELSIF NEW.subscription_tier = 'intro' THEN
    NEW.total_conversation_minutes := 60;
  ELSIF NEW.subscription_tier = 'professional' THEN
    NEW.total_conversation_minutes := 330;
  ELSIF NEW.subscription_tier = 'executive' THEN
    NEW.total_conversation_minutes := 900;
  END IF;
  
  -- Ensure used_conversation_minutes doesn't exceed total_conversation_minutes
  IF NEW.used_conversation_minutes > NEW.total_conversation_minutes THEN
    NEW.used_conversation_minutes := NEW.total_conversation_minutes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation minutes when subscription changes
DROP TRIGGER IF EXISTS update_conversation_minutes ON profiles;
CREATE TRIGGER update_conversation_minutes
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
EXECUTE FUNCTION handle_subscription_update();

-- Populate subscription plans
INSERT INTO subscription_plans (id, name, description, amount, currency, interval_type, conversation_minutes, features) VALUES
-- Intro Monthly
('price_intro_monthly', 'Intro', 'Perfect for getting started', 3900, 'usd', 'month', 60, 
 '["60 conversation minutes/month", "Basic feedback analysis", "Standard question library", "Email support", "Progress tracking", "Mobile app access"]'),

-- Intro Annual
('price_intro_annual', 'Intro', 'Perfect for getting started', 44500, 'usd', 'year', 720,
 '["720 conversation minutes/year", "Basic feedback analysis", "Standard question library", "Email support", "Progress tracking", "Mobile app access"]'),

-- Professional Monthly
('price_professional_monthly', 'Professional', 'Most popular for job seekers', 19900, 'usd', 'month', 330,
 '["330 conversation minutes/month", "Advanced feedback & coaching", "Industry-specific questions", "Video analysis & tips", "Priority support", "Performance analytics", "Custom interview scenarios", "Resume optimization tips"]'),

-- Professional Annual
('price_professional_annual', 'Professional', 'Most popular for job seekers', 226800, 'usd', 'year', 3960,
 '["3960 conversation minutes/year", "Advanced feedback & coaching", "Industry-specific questions", "Video analysis & tips", "Priority support", "Performance analytics", "Custom interview scenarios", "Resume optimization tips"]'),

-- Executive Monthly
('price_executive_monthly', 'Executive', 'For senior-level positions', 49900, 'usd', 'month', 900,
 '["900 conversation minutes/month", "Executive-level scenarios", "Custom interview prep", "1-on-1 coaching calls", "White-glove support", "Advanced analytics", "Leadership assessments", "Salary negotiation guidance", "Personal brand coaching"]'),

-- Executive Annual
('price_executive_annual', 'Executive', 'For senior-level positions', 539100, 'usd', 'year', 10800,
 '["10800 conversation minutes/year", "Executive-level scenarios", "Custom interview prep", "1-on-1 coaching calls", "White-glove support", "Advanced analytics", "Leadership assessments", "Salary negotiation guidance", "Personal brand coaching"]')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  conversation_minutes = EXCLUDED.conversation_minutes,
  features = EXCLUDED.features,
  updated_at = NOW();