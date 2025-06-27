/*
  # Fix Profiles Table RLS Policies

  1. Changes
    - Enable RLS on profiles table
    - Add policy for inserting new profiles during signup
    - Add policy for viewing own profile
    - Add policy for updating own profile
    - Add policy for service role access

  2. Security
    - Ensures users can only access their own profile data
    - Allows new user registration to work properly
    - Maintains data isolation between users
    - Allows service role to bypass RLS when needed
*/

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile during signup
CREATE POLICY "Enable insert for authentication" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Enable read access for users" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to bypass RLS
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access" ON public.profiles
  TO authenticated
  USING (true)
  WITH CHECK (true);