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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAuthenticated = !!user;

  // Initialize user session on load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setCurrentSessionId(session.access_token);
          await handleSession(session);
        }
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session) {
              // Skip processing if we're in the middle of a manual login
              if (isLoggingIn) {
                return;
              }
              
              // Check if this is the same session we already processed
              if (currentSessionId === session.access_token) {
                return;
              }
              
              setCurrentSessionId(session.access_token);
              await handleSession(session);
            } else {
              // User signed out
              setCurrentSessionId(null);
              setUser(null);
            }
          }
        );
        
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        setUser(null);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Handles setting the user from a session
  const handleSession = async (session: Session) => {
    const supabaseUser = session.user;
    
    if (!supabaseUser) {
      setUser(null);
      return;
    }
    
    try {
      // Get profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      let userProfile;
      
      // If profile doesn't exist, create it
      if (error || !profile) {
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
          setUser(null);
          return;
        }
        
        userProfile = {
          id: newProfile.id,
          name: newProfile.name,
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url || generateGravatarUrl(supabaseUser.email || ''),
          subscription_tier: newProfile.subscription_tier || 'free',
          total_conversation_minutes: newProfile.total_conversation_minutes || 25,
          used_conversation_minutes: newProfile.used_conversation_minutes || 0
        };
      } else {
        // Use existing profile
        userProfile = {
          id: profile.id,
          name: profile.name,
          email: supabaseUser.email || '',
          avatar: supabaseUser.user_metadata?.avatar_url || generateGravatarUrl(supabaseUser.email || ''),
          subscription_tier: profile.subscription_tier || 'free',
          total_conversation_minutes: profile.total_conversation_minutes || 25,
          used_conversation_minutes: profile.used_conversation_minutes || 0
        };
      }
      
      setUser(userProfile);
    } catch (error) {
      console.error('[AuthContext] Error handling session:', error);
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
        await handleSession(data.session);
      } else if (data.user && !data.session) {
        // Email confirmation required
        throw new Error('Please check your email and click the confirmation link to complete your registration.');
      }
    } catch (error: unknown) {
      console.error('[AuthContext] Signup error:', error);
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
    
    // Clear any previous session tracking to allow fresh login
    setCurrentSessionId(null);
    
    try {
      if (provider === 'email' && credentials) {
        // Set flag to prevent auth state change interference
        setIsLoggingIn(true);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (error) throw error;
        
        if (data.session) {
          // Set the session ID immediately to prevent duplicate processing
          setCurrentSessionId(data.session.access_token);
          await handleSession(data.session);
        } else {
          throw new Error('No session returned from login');
        }
      } else if (['google', 'github'].includes(provider)) {
        // For OAuth providers
        const providerEnum = provider as Provider;
        const currentOrigin = window.location.origin;
        const redirectUrl = options?.redirectTo || `${currentOrigin}/dashboard`;
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: providerEnum,
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              prompt: 'select_account',
            }
          }
        });
        
        if (error) throw error;
        
        // For OAuth, the redirect will happen automatically
        // Don't set loading to false here since we're redirecting
        return;
      } else {
        throw new Error('Invalid login method');
      }
    } catch (error: unknown) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error during sign in';
      throw new Error(errorMessage);
    } finally {
      // Clear the login flag
      setIsLoggingIn(false);
      
      // Only set loading to false for email login, OAuth will redirect
      if (provider === 'email') {
        setLoading(false);
      }
    }
  };

  const logout = async (): Promise<void> => {
    // Clear user state immediately for instant UI feedback
    setUser(null);
    setCurrentSessionId(null);
    
    try {
      // Clear any stored auth tokens
      await clearAuthTokens();
    } catch (error) {
      // Don't let logout fail if token clearing fails
      console.error('Error during logout cleanup:', error);
    }
    
    // Always redirect to home page after logout, regardless of cleanup success
    window.location.href = '/';
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
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;