/*
  # Update auth schema for email authentication

  1. Changes
     - Add email_confirmed field to profiles table for tracking email verification status
     
  2. Security
     - Ensures appropriate RLS policies are in place for auth
*/

-- Add email_confirmed field to profiles table
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;

-- Ensure the auth schema is configured properly (these are typically handled by Supabase automatically)
-- Creating a storage bucket for avatars if it doesn't exist already
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow public read access to avatars
CREATE POLICY "Public avatars are viewable by everyone." 
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create a policy to allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar." 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy to allow users to update/delete their own avatar
CREATE POLICY "Users can update/delete their own avatar." 
ON storage.objects 
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar." 
ON storage.objects 
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);