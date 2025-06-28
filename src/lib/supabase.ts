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
    console.log('Clearing auth tokens from localStorage...');
    // Clear all auth-related items from localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-')) {
        console.log(`Found token to remove: ${key}`);
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed token: ${key}`);
    })
    
    // Sign out to clear any remaining session
    console.log('Calling supabase.auth.signOut() to clear remaining session');
    await supabase.auth.signOut()
    console.log('Auth tokens cleared successfully');
  } catch (error) {
    console.error('Error clearing auth tokens:', error)
  }
}

// Handle auth state changes and token errors
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    // Clear any remaining tokens when signed out
    console.log('SIGNED_OUT event detected in supabase.ts');
    await clearAuthTokens();
  }
})

// Add error handling for token refresh failures
const originalRefreshSession = supabase.auth.refreshSession.bind(supabase.auth)
supabase.auth.refreshSession = async () => {
  try {
    return await originalRefreshSession()
  } catch (error: any) {
    console.error('Error refreshing session:', error);
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token')) {
      console.warn('Invalid refresh token detected, clearing auth state')
      await clearAuthTokens()
      return { data: { session: null, user: null }, error: null }
    }
    throw error
  }
}