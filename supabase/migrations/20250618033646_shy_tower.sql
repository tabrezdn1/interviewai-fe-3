/*
  # Remove avatar_url Column from Profiles Table
  
  1. Changes
    - Remove the avatar_url column from the profiles table
    
  2. Purpose
    - Clean up unused settings from the database schema
    - Complete the removal of avatar image support
    - Simplify the profiles table structure
*/

-- Remove avatar_url column from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS avatar_url;

-- Remove any storage policies related to avatars that might exist
DROP POLICY IF EXISTS "Public avatars are viewable by everyone." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;