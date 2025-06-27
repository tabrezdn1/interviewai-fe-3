# Development OAuth Setup for Bolt Testing

If you want to test OAuth in Bolt's preview environment, you'll need to create separate development OAuth applications:

## 1. Create Development GitHub OAuth App
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: `InterviewAI Dev`
   - **Homepage URL**: `https://your-bolt-preview-url.bolt.new`
   - **Authorization callback URL**: `https://klzhnngxriswlaxsstzb.supabase.co/auth/v1/callback`

## 2. Create Development Google OAuth App
1. Go to Google Cloud Console
2. Create a new project or use existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized JavaScript origins**: `https://your-bolt-preview-url.bolt.new`
   - **Authorized redirect URIs**: `https://klzhnngxriswlaxsstzb.supabase.co/auth/v1/callback`

## 3. Update Supabase for Development
In Supabase Dashboard → Authentication → URL Configuration:
- Add your Bolt preview URL to **Redirect URLs**: `https://your-bolt-preview-url.bolt.new/**`

## 4. Environment-based Configuration
You could also set up environment variables to use different OAuth credentials for development vs production.

## Current Status
Your OAuth is correctly configured for production (`https://interviewai.us`). The redirect you're seeing is expected behavior - the system is working as designed!

## Recommendation
Test your OAuth login directly on `https://interviewai.us` where it's properly configured. The authentication flow should work perfectly there.