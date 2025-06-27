# OAuth Setup Instructions

## Current Issues and Fixes

### 1. GitHub OAuth App Settings
**Problem**: Your redirect URI is set to `https://interviewai.us/` but it should be the Supabase callback URL.

**Fix**: 
- Go to your GitHub OAuth app settings
- Change the "Authorization callback URL" from:
  ```
  https://interviewai.us/
  ```
  To:
  ```
  https://klzhnngxriswlaxsstzb.supabase.co/auth/v1/callback
  ```

### 2. Google OAuth Settings
**Current**: You have `https://interviewai.us` in "Authorized JavaScript origins" ✅ (This is correct)

**Need to check**: In the "Authorized redirect URIs" section, you should have:
```
https://klzhnngxriswlaxsstzb.supabase.co/auth/v1/callback
```

### 3. Supabase Settings (Double-check these)
In your Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://interviewai.us`
- **Redirect URLs**: `https://interviewai.us/**`

## Why this happens:
OAuth providers need to redirect back to Supabase first (not directly to your app), then Supabase handles the authentication and redirects to your app.

## The OAuth Flow:
1. User clicks "Login with Google/GitHub" on your app
2. User is redirected to Google/GitHub
3. User authorizes your app
4. Google/GitHub redirects to Supabase callback URL
5. Supabase processes the auth and redirects to your app

## Test after making these changes:
1. Update the redirect URLs in both GitHub and Google
2. Wait 5-10 minutes for changes to propagate
3. Try logging in again