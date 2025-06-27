/*
  # Initial Database Schema for Interview AI Application
  
  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `interview_types` - Types of interviews (technical, behavioral, mixed)
    - `experience_levels` - Experience levels for candidates
    - `difficulty_levels` - Difficulty levels for interviews
    - `interviews` - Interview sessions data
    - `questions` - Interview questions
    - `interview_questions` - Junction table for interviews and questions
    - `feedback` - Detailed feedback for interviews
    
  2. Security
    - Enable RLS on all tables
    - Set policies for users to access their own data
*/

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create interview_types table
CREATE TABLE IF NOT EXISTS interview_types (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create experience_levels table
CREATE TABLE IF NOT EXISTS experience_levels (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create difficulty_levels table
CREATE TABLE IF NOT EXISTS difficulty_levels (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  role TEXT NOT NULL,
  interview_type_id INTEGER NOT NULL REFERENCES interview_types(id) ON DELETE RESTRICT,
  experience_level_id INTEGER REFERENCES experience_levels(id) ON DELETE SET NULL,
  difficulty_level_id INTEGER NOT NULL REFERENCES difficulty_levels(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'canceled')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  interview_type_id INTEGER NOT NULL REFERENCES interview_types(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  hint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create interview_questions junction table
CREATE TABLE IF NOT EXISTS interview_questions (
  id SERIAL PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  answer TEXT,
  analysis TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (interview_id, question_id)
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  summary TEXT NOT NULL,
  strengths TEXT[],
  improvements TEXT[],
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
  technical_feedback TEXT,
  communication_feedback TEXT,
  problem_solving_feedback TEXT,
  experience_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (interview_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for interviews
CREATE POLICY "Users can view their own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
  ON interviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews"
  ON interviews FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for interview_questions
CREATE POLICY "Users can view their own interview questions"
  ON interview_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own interview questions"
  ON interview_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own interview questions"
  ON interview_questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id
    AND interviews.user_id = auth.uid()
  ));

-- Policies for feedback
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert feedback for their own interviews"
  ON feedback FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can update feedback for their own interviews"
  ON feedback FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM interviews
    WHERE interviews.id = interview_id
    AND interviews.user_id = auth.uid()
  ));

-- Everyone can view interview types, experience levels, difficulty levels, and questions
ALTER TABLE interview_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view interview types"
  ON interview_types FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE experience_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view experience levels"
  ON experience_levels FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE difficulty_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view difficulty levels"
  ON difficulty_levels FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);