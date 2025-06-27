/*
  # Enhanced User Settings Schema
  
  1. New Data
    - Add additional fields to user_preferences table
    - Add functions for managing user settings
    
  2. Changes
    - Ensure user_preferences table has all necessary fields
    - Add RPC functions for easier settings management
    - Add triggers for automatic timestamp updates
*/

-- Ensure user_preferences table exists with all needed fields
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  email_notifications BOOLEAN DEFAULT true,
  interview_reminders BOOLEAN DEFAULT true,
  feedback_notifications BOOLEAN DEFAULT true,
  preferred_interview_duration INTEGER DEFAULT 20,
  auto_save_responses BOOLEAN DEFAULT true,
  show_tips BOOLEAN DEFAULT true,
  accessibility_mode BOOLEAN DEFAULT false,
  desktop_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Add security settings table
CREATE TABLE IF NOT EXISTS user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method TEXT DEFAULT 'email' CHECK (two_factor_method IN ('email', 'app', 'sms')),
  login_notifications BOOLEAN DEFAULT true,
  last_password_change TIMESTAMPTZ,
  password_reset_required BOOLEAN DEFAULT false,
  security_questions_set BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Add privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public', 'connections')),
  share_activity BOOLEAN DEFAULT false,
  allow_data_collection BOOLEAN DEFAULT true,
  allow_recommendations BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security settings
CREATE POLICY "Users can view their own security settings" ON user_security_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON user_security_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings" ON user_security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for privacy settings
CREATE POLICY "Users can view their own privacy settings" ON user_privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS SETOF user_preferences AS $$
BEGIN
  -- Try to get existing preferences
  RETURN QUERY
  SELECT * FROM user_preferences WHERE user_id = p_user_id;
  
  -- If no rows returned, create default preferences
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user security settings
CREATE OR REPLACE FUNCTION get_or_create_security_settings(p_user_id UUID)
RETURNS SETOF user_security_settings AS $$
BEGIN
  -- Try to get existing settings
  RETURN QUERY
  SELECT * FROM user_security_settings WHERE user_id = p_user_id;
  
  -- If no rows returned, create default settings
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO user_security_settings (user_id)
    VALUES (p_user_id)
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user privacy settings
CREATE OR REPLACE FUNCTION get_or_create_privacy_settings(p_user_id UUID)
RETURNS SETOF user_privacy_settings AS $$
BEGIN
  -- Try to get existing settings
  RETURN QUERY
  SELECT * FROM user_privacy_settings WHERE user_id = p_user_id;
  
  -- If no rows returned, create default settings
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO user_privacy_settings (user_id)
    VALUES (p_user_id)
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id UUID,
  p_theme TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT NULL,
  p_email_notifications BOOLEAN DEFAULT NULL,
  p_interview_reminders BOOLEAN DEFAULT NULL,
  p_feedback_notifications BOOLEAN DEFAULT NULL,
  p_preferred_interview_duration INTEGER DEFAULT NULL,
  p_auto_save_responses BOOLEAN DEFAULT NULL,
  p_show_tips BOOLEAN DEFAULT NULL,
  p_accessibility_mode BOOLEAN DEFAULT NULL,
  p_desktop_notifications BOOLEAN DEFAULT NULL
)
RETURNS SETOF user_preferences AS $$
BEGIN
  -- First ensure preferences exist
  PERFORM get_or_create_user_preferences(p_user_id);
  
  -- Update only the provided fields
  RETURN QUERY
  UPDATE user_preferences
  SET
    theme = COALESCE(p_theme, theme),
    language = COALESCE(p_language, language),
    timezone = COALESCE(p_timezone, timezone),
    email_notifications = COALESCE(p_email_notifications, email_notifications),
    interview_reminders = COALESCE(p_interview_reminders, interview_reminders),
    feedback_notifications = COALESCE(p_feedback_notifications, feedback_notifications),
    preferred_interview_duration = COALESCE(p_preferred_interview_duration, preferred_interview_duration),
    auto_save_responses = COALESCE(p_auto_save_responses, auto_save_responses),
    show_tips = COALESCE(p_show_tips, show_tips),
    accessibility_mode = COALESCE(p_accessibility_mode, accessibility_mode),
    desktop_notifications = COALESCE(p_desktop_notifications, desktop_notifications),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user security settings
CREATE OR REPLACE FUNCTION update_security_settings(
  p_user_id UUID,
  p_two_factor_enabled BOOLEAN DEFAULT NULL,
  p_two_factor_method TEXT DEFAULT NULL,
  p_login_notifications BOOLEAN DEFAULT NULL
)
RETURNS SETOF user_security_settings AS $$
BEGIN
  -- First ensure settings exist
  PERFORM get_or_create_security_settings(p_user_id);
  
  -- Update only the provided fields
  RETURN QUERY
  UPDATE user_security_settings
  SET
    two_factor_enabled = COALESCE(p_two_factor_enabled, two_factor_enabled),
    two_factor_method = COALESCE(p_two_factor_method, two_factor_method),
    login_notifications = COALESCE(p_login_notifications, login_notifications),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user privacy settings
CREATE OR REPLACE FUNCTION update_privacy_settings(
  p_user_id UUID,
  p_profile_visibility TEXT DEFAULT NULL,
  p_share_activity BOOLEAN DEFAULT NULL,
  p_allow_data_collection BOOLEAN DEFAULT NULL,
  p_allow_recommendations BOOLEAN DEFAULT NULL,
  p_marketing_emails BOOLEAN DEFAULT NULL
)
RETURNS SETOF user_privacy_settings AS $$
BEGIN
  -- First ensure settings exist
  PERFORM get_or_create_privacy_settings(p_user_id);
  
  -- Update only the provided fields
  RETURN QUERY
  UPDATE user_privacy_settings
  SET
    profile_visibility = COALESCE(p_profile_visibility, profile_visibility),
    share_activity = COALESCE(p_share_activity, share_activity),
    allow_data_collection = COALESCE(p_allow_data_collection, allow_data_collection),
    allow_recommendations = COALESCE(p_allow_recommendations, allow_recommendations),
    marketing_emails = COALESCE(p_marketing_emails, marketing_emails),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user settings in one call
CREATE OR REPLACE FUNCTION get_all_user_settings(p_user_id UUID)
RETURNS TABLE (
  profile JSONB,
  preferences JSONB,
  security JSONB,
  privacy JSONB
) AS $$
BEGIN
  -- Ensure all settings exist
  PERFORM get_or_create_user_preferences(p_user_id);
  PERFORM get_or_create_security_settings(p_user_id);
  PERFORM get_or_create_privacy_settings(p_user_id);
  
  RETURN QUERY
  SELECT 
    to_jsonb(p.*) AS profile,
    to_jsonb(up.*) AS preferences,
    to_jsonb(us.*) AS security,
    to_jsonb(upv.*) AS privacy
  FROM 
    profiles p
    LEFT JOIN user_preferences up ON p.id = up.user_id
    LEFT JOIN user_security_settings us ON p.id = us.user_id
    LEFT JOIN user_privacy_settings upv ON p.id = upv.user_id
  WHERE 
    p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;