# OAuth Setup for Bolt Preview

To make OAuth work in Bolt's preview environment, you need to update your OAuth provider settings:

## 1. GitHub OAuth App Settings

Go to your GitHub OAuth app settings and add the Bolt preview URL:

**Authorization callback URL**: Keep your existing Supabase callback URL:
```
https://klzhnngxriswlaxsstzb.supabase.co/auth/v1/callback
```

## 2. Google OAuth Settings

In Google Cloud Console, update your OAuth 2.0 credentials:

**Authorized JavaScript origins**: Add your Bolt preview URL:
```
https://your-bolt-preview-url.bolt.new
```

**Authorized redirect URIs**: Keep your existing Supabase callback URL:
```
https://klzhnngxriswlaxsstzb.supabase.co/auth/v1/callback
```

## 3. Supabase Settings

In your Supabase Dashboard → Authentication → URL Configuration:

**Site URL**: Keep as `https://interviewai.us`

**Redirect URLs**: Add your Bolt preview URL:
```
https://interviewai.us/**
https://your-bolt-preview-url.bolt.new/**
```

## 4. How to get your Bolt preview URL

1. Look at the current URL in your browser - it should be something like:
   ```
   https://stackblitz-starters-abc123.bolt.new
   ```

2. Use this URL in the OAuth settings above

## 5. Testing Steps

1. Update the OAuth settings in GitHub and Google
2. Update Supabase redirect URLs
3. Wait 5-10 minutes for changes to propagate
4. Try OAuth login in Bolt preview

## Important Notes

- The OAuth flow will still go through Supabase's callback URL
- Supabase will then redirect back to your Bolt preview URL
- Make sure both your production domain AND Bolt preview URL are configured

## Current OAuth Flow

1. User clicks login → Redirected to OAuth provider
2. User authorizes → OAuth provider redirects to Supabase callback
3. Supabase processes auth → Redirects to your app (Bolt preview URL)
4. Your app receives the authenticated user

The key is making sure your OAuth providers trust both your production domain AND the Bolt preview domain.