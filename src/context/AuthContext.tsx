import React, { createContext, useState, useEffect } from 'react';
import { Session, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { generateGravatarUrl } from '../lib/utils.tsx';
import { clearAuthTokens } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription_tier?: string;
  total_conversation_minutes?: number;
  used_conversation_minutes?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (
    provider: string,
    credentials?: { email: string; password: string },
    options?: { redirectTo?: string }
  ) => Promise<void>;
  signUp: (credentials: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
}

// Create context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { },
  signUp: async () => { },
  logout: async () => { },
  updateUser: () => { },
  isAuthenticated: false,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize user session on load
  useEffect(() => {
    const getUserSession = async () => {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 10000);
      
      try {
        // Check active session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (session) {
          await handleSession(session);
        } else {
          setUser(null);
        }
        
        setLoading(false);
        clearTimeout(timeoutId);
        
        // Listen for auth state changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            // Set loading to true for all auth state changes except TOKEN_REFRESHED
            if (event !== 'TOKEN_REFRESHED') {
              setLoading(true);
            }

            if (session) {
              await handleSession(session);
            } else {
              setUser(null);
            }

            // Always set loading to false after handling auth state change
            setLoading(false);
          }
        );
        
        return () => {
          subscription.unsubscribe();
          clearTimeout(timeoutId);
        };
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };
    
    getUserSession();
  }, []);
  
  // Handles setting the user from a session
  const handleSession = async (session: Session) => {
    const supabaseUser = session.user;
    
    if (!supabaseUser) {
      setUser(null);
      return;
    }
    
    // Get profile data
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      // If profile doesn't exist, create it
      if (error || !profile) {
        // Create new profile using user data from auth
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            subscription_tier: 'free',
            total_conversation_minutes: 25,
            used_conversation_minutes: 0
          })
          .select('*')
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          setUser(null);
          return;
        }
        
        setUser({
          id: newProfile.id,
          name: newProfile.name,
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url || generateGravatarUrl(supabaseUser.email || ''),
          subscription_tier: newProfile.subscription_tier || 'free',
          total_conversation_minutes: newProfile.total_conversation_minutes || 25,
          used_conversation_minutes: newProfile.used_conversation_minutes || 0
        });
      } else {
        // Use existing profile
        setUser({
          id: profile.id,
          name: profile.name,
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url || generateGravatarUrl(supabaseUser.email || ''),
          subscription_tier: profile.subscription_tier || 'free',
          total_conversation_minutes: profile.total_conversation_minutes || 25,
          used_conversation_minutes: profile.used_conversation_minutes || 0
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    }
  };

  const signUp = async (credentials: { email: string; password: string; name: string }): Promise<void> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      
      if (data.user && data.session) {
        // User is automatically signed in after signup
        await handleSession(data.session);
      } else if (data.user && !data.session) {
        // Email confirmation required
        throw new Error('Please check your email and click the confirmation link to complete your registration.');
      }
    } catch (error: unknown) {
      console.error('Error signing up:', error);
      // Preserve the original error object to maintain error codes
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    provider: string,
    credentials?: { email: string; password: string },  
    options?: { redirectTo?: string }
  ): Promise<void> => {
    setLoading(true);
    
    try {
      if (provider === 'email' && credentials) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (error) throw error;
        
        if (data.session) {
          await handleSession(data.session);
        }
      } else if (['google', 'github'].includes(provider)) {
        // For OAuth providers, we need to use signInWithOAuth
        const providerEnum = provider as Provider;
        
        // Get the current origin for redirect
        const currentOrigin = window.location.origin;
        const redirectUrl = options?.redirectTo || `${currentOrigin}/dashboard`;
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: providerEnum,
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              // Optional additional parameters
              prompt: 'select_account', // Force account selection (Google)
            }
          }
        });
        
        if (error) throw error;
        
        // For OAuth, we don't set user here because it will be handled by the auth state change
        // after redirect back from the OAuth provider
      } else {
        throw new Error('Invalid login method');
      }
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error during sign in';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // First clear any tokens from localStorage
      await clearAuthTokens();
      
      // Then call signOut
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, clear the user state and redirect
      setUser(null);
      window.location.href = '/';
    }
  };

  const updateUser = (updates: Partial<UserProfile>): void => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        ...updates,
      } as UserProfile;
    });
  };

  const value = {
    user,
    loading,
    login,
    signUp,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;