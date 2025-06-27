/*
  # Mock Active Subscription for Test User
  
  1. New Data
    - Create a mock subscription for the test user
    - Set up a mock payment method
    - Create a mock invoice
    - Update the user's profile with subscription details
    
  2. Purpose
    - Provide a realistic subscription experience for testing
    - Enable all intro plan features for the test account
*/

-- First, let's ensure we have a test user to work with
DO $$
DECLARE
  test_user_id UUID;
  test_customer_id TEXT := 'cus_mock_test_user';
  test_subscription_id TEXT := 'sub_mock_test_user';
  test_payment_method_id TEXT := 'pm_mock_test_user';
  test_invoice_id TEXT := 'in_mock_test_user';
  intro_plan_id TEXT := 'price_intro_monthly';
BEGIN
  -- Get a user to use as our test user (first user in the system)
  SELECT id INTO test_user_id FROM profiles LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the system';
  END IF;
  
  -- Update the user's profile with subscription details
  UPDATE profiles
  SET 
    stripe_customer_id = test_customer_id,
    current_subscription_id = test_subscription_id,
    subscription_status = 'active',
    subscription_tier = 'intro',
    total_conversation_minutes = 60,
    used_conversation_minutes = 5,
    subscription_current_period_start = NOW(),
    subscription_current_period_end = NOW() + INTERVAL '30 days',
    subscription_cancel_at_period_end = false
  WHERE id = test_user_id;
  
  -- Create a mock subscription
  INSERT INTO subscriptions (
    id, 
    user_id, 
    stripe_customer_id, 
    plan_id, 
    status, 
    current_period_start, 
    current_period_end, 
    cancel_at_period_end
  ) VALUES (
    test_subscription_id,
    test_user_id,
    test_customer_id,
    intro_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    false
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '30 days',
    cancel_at_period_end = false;
  
  -- Create a mock payment method
  INSERT INTO payment_methods (
    id,
    user_id,
    stripe_customer_id,
    type,
    card_brand,
    card_last4,
    card_exp_month,
    card_exp_year,
    is_default
  ) VALUES (
    test_payment_method_id,
    test_user_id,
    test_customer_id,
    'card',
    'visa',
    '4242',
    12,
    2028,
    true
  ) ON CONFLICT (id) DO UPDATE SET
    card_brand = 'visa',
    card_last4 = '4242',
    card_exp_month = 12,
    card_exp_year = 2028,
    is_default = true;
  
  -- Create a mock invoice
  INSERT INTO invoices (
    id,
    user_id,
    subscription_id,
    stripe_customer_id,
    amount_paid,
    amount_due,
    status,
    description,
    created_at,
    period_start,
    period_end
  ) VALUES (
    test_invoice_id,
    test_user_id,
    test_subscription_id,
    test_customer_id,
    3900, -- $39.00
    3900,
    'paid',
    'Intro Plan - Monthly',
    NOW() - INTERVAL '1 day',
    NOW(),
    NOW() + INTERVAL '30 days'
  ) ON CONFLICT (id) DO UPDATE SET
    status = 'paid',
    amount_paid = 3900,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '30 days';
  
  -- Create usage tracking entry
  INSERT INTO usage_tracking (
    user_id,
    subscription_id,
    minutes_used,
    billing_period_start,
    billing_period_end
  ) VALUES (
    test_user_id,
    test_subscription_id,
    5,
    NOW(),
    NOW() + INTERVAL '30 days'
  );
  
  -- Output the test user ID for reference
  RAISE NOTICE 'Created mock subscription for user %', test_user_id;
END $$;