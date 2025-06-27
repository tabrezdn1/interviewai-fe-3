/*
  # Database Schema Enhancements for InterviewAI
  
  1. Performance Improvements
    - Add indexes for better query performance
    
  2. New Tables for Enhanced Features
    - interview_rounds - Support for multi-round interviews
    - user_preferences - Store user settings and preferences  
    - interview_recordings - Track video session recordings
    - notifications - User notification system
    - companies - Normalize company data
    - job_roles - Normalize job role data
    - question_categories - Better organization of questions
    - user_analytics - Track user performance over time
    - tavus_configurations - Store AI replica/persona mappings
    
  3. Schema Improvements
    - Add missing timestamps and tracking fields
    - Improve data consistency with normalization
    - Add better constraints and validation
*/

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_questions_interview_type_id ON questions(interview_type_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interview_id ON feedback(interview_id);

-- Companies table for better data consistency
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Job roles table for better data consistency  
CREATE TABLE IF NOT EXISTS job_roles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'engineering', 'product', 'design', 'marketing', etc.
  level TEXT CHECK (level IN ('entry', 'mid', 'senior', 'staff', 'principal', 'executive')),
  keywords TEXT[], -- for search/matching
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Interview rounds table for multi-round interviews
CREATE TABLE IF NOT EXISTS interview_rounds (
  id SERIAL PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  round_type TEXT NOT NULL, -- 'screening', 'technical', 'behavioral', 'final'
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  tavus_conversation_id TEXT, -- Link to Tavus conversation
  tavus_replica_id TEXT, -- Which AI replica was used
  tavus_persona_id TEXT, -- Which AI persona was used
  duration_minutes INTEGER DEFAULT 30,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(interview_id, round_number)
);

-- User preferences table
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
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Interview recordings table
CREATE TABLE IF NOT EXISTS interview_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  round_id INTEGER REFERENCES interview_rounds(id) ON DELETE CASCADE,
  recording_url TEXT,
  transcript_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'ready', 'failed', 'expired')),
  expires_at TIMESTAMPTZ, -- For data retention
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Question categories for better organization
CREATE TABLE IF NOT EXISTS question_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INTEGER REFERENCES question_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enhanced questions table with categories
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES question_categories(id),
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'interview_reminder', 'feedback_ready', 'system_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User analytics for tracking performance over time
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'interview_score', 'response_time', 'confidence_level'
  metric_value DECIMAL NOT NULL,
  metadata JSONB, -- Additional context data
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tavus configurations for AI replica/persona mappings
CREATE TABLE IF NOT EXISTS tavus_configurations (
  id SERIAL PRIMARY KEY,
  interview_type TEXT NOT NULL REFERENCES interview_types(type),
  replica_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  replica_name TEXT,
  persona_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Interview templates for quick setup
CREATE TABLE IF NOT EXISTS interview_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for system templates
  name TEXT NOT NULL,
  description TEXT,
  interview_type_id INTEGER NOT NULL REFERENCES interview_types(id),
  difficulty_level_id INTEGER NOT NULL REFERENCES difficulty_levels(id),
  duration_minutes INTEGER DEFAULT 30,
  question_ids INTEGER[], -- Pre-selected questions
  settings JSONB, -- Additional template settings
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add missing fields to existing tables
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'intro', 'professional', 'executive')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS job_role_id INTEGER REFERENCES job_roles(id),
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES interview_templates(id),
ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS interview_mode TEXT DEFAULT 'single' CHECK (interview_mode IN ('single', 'multi_round', 'complete'));

ALTER TABLE interview_questions
ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5);

-- Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tavus_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies and job roles - readable by all authenticated users
CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Job roles are viewable by authenticated users" ON job_roles  
  FOR SELECT TO authenticated USING (true);

-- Interview rounds - users can access their own interview rounds
CREATE POLICY "Users can view their own interview rounds" ON interview_rounds
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM interviews 
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own interview rounds" ON interview_rounds
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM interviews 
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own interview rounds" ON interview_rounds
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM interviews 
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

-- User preferences - users can access their own preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Interview recordings - users can access their own recordings
CREATE POLICY "Users can view their own recordings" ON interview_recordings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM interviews 
    WHERE interviews.id = interview_id AND interviews.user_id = auth.uid()
  ));

-- Question categories - readable by all authenticated users
CREATE POLICY "Question categories are viewable by authenticated users" ON question_categories
  FOR SELECT TO authenticated USING (true);

-- Notifications - users can access their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User analytics - users can access their own analytics
CREATE POLICY "Users can view their own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tavus configurations - readable by all authenticated users
CREATE POLICY "Tavus configurations are viewable by authenticated users" ON tavus_configurations
  FOR SELECT TO authenticated USING (true);

-- Interview templates - users can access public templates and their own
CREATE POLICY "Users can view public and own templates" ON interview_templates
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON interview_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON interview_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON interview_templates
  FOR DELETE USING (auth.uid() = user_id);