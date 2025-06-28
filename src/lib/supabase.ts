import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with proper error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Function to clear invalid tokens and reset auth state
export const clearAuthTokens = async () => {
  try {
    console.log('🧹 clearAuthTokens: Clearing auth tokens from localStorage...');
    // Clear all auth-related items from localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        console.log(`🧹 clearAuthTokens: Found token to remove: ${key}`);
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 clearAuthTokens: Removed token: ${key}`);
    })
    
    // Sign out to clear any remaining session
    console.log('🧹 clearAuthTokens: Calling supabase.auth.signOut() to clear remaining session');
    await supabase.auth.signOut()
    console.log('🧹 clearAuthTokens: Auth tokens cleared successfully');
  } catch (error) {
    console.error('🧹 clearAuthTokens: Error clearing auth tokens:', error)
  }
}

// Handle auth state changes and token errors
supabase.auth.onAuthStateChange(async (event) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 supabase.ts: Token refreshed successfully')
  } else if (event === 'SIGNED_OUT') {
    // Clear any remaining tokens when signed out
    console.log('🔄 supabase.ts: SIGNED_OUT event detected');
    await clearAuthTokens();
  }
})

// Add error handling for token refresh failures
const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth)
supabase.auth.refreshSession = async () => {
  try {
    return await originalRefreshSession()
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    console.error('🔄 supabase.ts: Error refreshing session:', errorObj);
    
    if (errorObj?.message?.includes('refresh_token_not_found') || 
        errorObj?.message?.includes('Invalid Refresh Token')) {
      console.warn('🔄 supabase.ts: Invalid refresh token detected, clearing auth state')
      await clearAuthTokens()
      return { data: { session: null, user: null }, error: null }
    }
    throw error
  }
}