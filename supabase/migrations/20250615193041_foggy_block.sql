/*
  # Drop Unused Database Tables
  
  This migration removes tables that are not currently being used by the application:
  - Billing and subscription related tables
  - User settings and preferences tables
  - Analytics and tracking tables
  - Interview enhancement tables that aren't implemented yet
  
  Keeps only the core tables needed for current functionality:
  - profiles, interviews, interview_types, experience_levels, difficulty_levels
  - questions, interview_questions, feedback, feedback_processing_jobs
*/

-- Drop triggers first (only if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profile_subscription') THEN
        DROP TRIGGER update_profile_subscription ON subscriptions;
    END IF;
END $$;

-- Drop functions that are no longer needed
DROP FUNCTION IF EXISTS get_or_create_user_preferences(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_or_create_security_settings(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_or_create_privacy_settings(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_preferences(UUID, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS update_security_settings(UUID, BOOLEAN, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS update_privacy_settings(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS get_all_user_settings(UUID) CASCADE;
DROP FUNCTION IF EXISTS track_conversation_usage(UUID, UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_current_period_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_subscription_status() CASCADE;
DROP FUNCTION IF EXISTS handle_subscription_update() CASCADE;

-- Drop tables in the correct order to respect foreign key constraints
-- First, drop tables that depend on others
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS user_privacy_settings CASCADE;
DROP TABLE IF EXISTS user_security_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS interview_recordings CASCADE;
DROP TABLE IF EXISTS interview_rounds CASCADE;
DROP TABLE IF EXISTS interview_templates CASCADE;
DROP TABLE IF EXISTS tavus_configurations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Then drop tables that others depend on
DROP TABLE IF EXISTS question_categories CASCADE;
DROP TABLE IF EXISTS job_roles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Remove columns from profiles table that reference dropped tables
DO $$ 
BEGIN
    -- Check and drop columns one by one to avoid errors if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE profiles DROP COLUMN stripe_customer_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_subscription_id') THEN
        ALTER TABLE profiles DROP COLUMN current_subscription_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles DROP COLUMN subscription_status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_current_period_start') THEN
        ALTER TABLE profiles DROP COLUMN subscription_current_period_start;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_current_period_end') THEN
        ALTER TABLE profiles DROP COLUMN subscription_current_period_end;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_cancel_at_period_end') THEN
        ALTER TABLE profiles DROP COLUMN subscription_cancel_at_period_end;
    END IF;
END $$;

-- Remove columns from interviews table that reference dropped tables
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'company_id') THEN
        ALTER TABLE interviews DROP COLUMN company_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'job_role_id') THEN
        ALTER TABLE interviews DROP COLUMN job_role_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'template_id') THEN
        ALTER TABLE interviews DROP COLUMN template_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'total_rounds') THEN
        ALTER TABLE interviews DROP COLUMN total_rounds;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'current_round') THEN
        ALTER TABLE interviews DROP COLUMN current_round;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'interview_mode') THEN
        ALTER TABLE interviews DROP COLUMN interview_mode;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'feedback_processing_status') THEN
        ALTER TABLE interviews DROP COLUMN feedback_processing_status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'tavus_conversation_id') THEN
        ALTER TABLE interviews DROP COLUMN tavus_conversation_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'feedback_requested_at') THEN
        ALTER TABLE interviews DROP COLUMN feedback_requested_at;
    END IF;
END $$;

-- Remove columns from questions table that reference dropped tables
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'category_id') THEN
        ALTER TABLE questions DROP COLUMN category_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'difficulty_level') THEN
        ALTER TABLE questions DROP COLUMN difficulty_level;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'estimated_time_minutes') THEN
        ALTER TABLE questions DROP COLUMN estimated_time_minutes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'tags') THEN
        ALTER TABLE questions DROP COLUMN tags;
    END IF;
END $$;

-- Remove columns from interview_questions table that reference dropped features
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_questions' AND column_name = 'answered_at') THEN
        ALTER TABLE interview_questions DROP COLUMN answered_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_questions' AND column_name = 'response_time_seconds') THEN
        ALTER TABLE interview_questions DROP COLUMN response_time_seconds;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_questions' AND column_name = 'confidence_level') THEN
        ALTER TABLE interview_questions DROP COLUMN confidence_level;
    END IF;
END $$;

-- Remove columns from feedback table that reference dropped features
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'processing_status') THEN
        ALTER TABLE feedback DROP COLUMN processing_status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'error_message') THEN
        ALTER TABLE feedback DROP COLUMN error_message;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'processing_started_at') THEN
        ALTER TABLE feedback DROP COLUMN processing_started_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'processing_completed_at') THEN
        ALTER TABLE feedback DROP COLUMN processing_completed_at;
    END IF;
END $$;

-- Clean up any remaining indexes that might reference dropped tables or columns
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_payment_methods_user_id;
DROP INDEX IF EXISTS idx_payment_methods_is_default;
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_usage_tracking_user_id;
DROP INDEX IF EXISTS idx_usage_tracking_billing_period;
DROP INDEX IF EXISTS idx_feedback_tavus_conversation_id;