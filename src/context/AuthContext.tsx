import React, { createContext, useState, useEffect } from 'react';
import { Session, User, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { generateGravatarUrl } from '../lib/utils.tsx';

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
  isAuthenticated: boolean;
}

// Create context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize user session on load
  useEffect(() => {
    const getUserSession = async () => {
      try {
        console.log('🔑 AuthContext: Getting user session...');
        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('🔑 AuthContext: Session result:', { hasSession: !!session });
        
        if (session) {
          console.log('🔑 AuthContext: Session found, handling session');
          await handleSession(session);
        } else {
          console.log('🔑 AuthContext: No session found, setting user to null');
          setUser(null);
        }
        
        // Mark auth as initialized
        setAuthInitialized(true);
        console.log('🔑 AuthContext: Setting loading to false');
        setLoading(false);
        
        // Listen for auth state changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state change event:", event, "Has session:", !!session);

            // Log specific SIGNED_OUT events for debugging
            if (event === 'SIGNED_OUT') {
              console.log('🔑 AuthContext: SIGNED_OUT event received, setting user to null');
            }

            // Only set loading to true for sign-in and sign-up events
            // This prevents unnecessary loading states when just navigating between pages
            const shouldShowLoading = ['SIGNED_IN', 'SIGNED_UP'].includes(event) && !session;
            if (shouldShowLoading && authInitialized) {
              setLoading(true);
            }

            if (session) {
              console.log('🔑 AuthContext: Auth state change with session, handling session');
              await handleSession(session);
            } else if (event !== 'TOKEN_REFRESHED') {
              console.log('🔑 AuthContext: Auth state change without session, setting user to null');
              setUser(null);
            }

            // Always set loading to false after handling auth state change
            setLoading(false);
          }
        );
        
        return () => {
          console.log('🔑 AuthContext: Unsubscribing from auth state changes');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error getting session:', error);
        console.log('🔑 AuthContext: Error in getUserSession, setting loading to false');
        setAuthInitialized(true);
        setLoading(false);
      }
    };
    
    getUserSession();
  }, []);
  
  // Handles setting the user from a session
  const handleSession = async (session: Session) => {
    console.log('🔑 AuthContext: Handling session');
    const supabaseUser = session.user;
    
    if (!supabaseUser) return;
    
    console.log("Handling session for user:", supabaseUser);
    
    // Get profile data
    try {
      console.log('🔑 AuthContext: Fetching profile data for user:', supabaseUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      // If profile doesn't exist, create it
      if (error || !profile) {
        console.log("🔑 AuthContext: Creating new profile for user:", supabaseUser.id);
        // Create new profile using user data from auth
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            email_confirmed: false,
            subscription_tier: 'free',
            total_conversation_minutes: 25,
            used_conversation_minutes: 0
          })
          .select('*')
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          console.log('🔑 AuthContext: Error creating profile');
          return;
        }
        
        console.log('🔑 AuthContext: Setting user from new profile');
        setUser({
          id: newProfile.id,
          name: newProfile.name,
          email: supabaseUser.email || '',
          subscription_tier: newProfile.subscription_tier || 'free',
          total_conversation_minutes: newProfile.total_conversation_minutes || 25,
          used_conversation_minutes: newProfile.used_conversation_minutes || 0
        });
      } else {
        // Use existing profile
        console.log('🔑 AuthContext: Setting user from existing profile');
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
      console.log('🔑 AuthContext: Error in handleSession');
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
    } catch (error: any) {
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
        
        const { data, error } = await supabase.auth.signInWithOAuth({
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
        console.log("OAuth redirect initiated:", data);
        console.log("Redirect URL:", redirectUrl);
      } else {
        throw new Error('Invalid login method');
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw new Error(error.error_description || error.message || 'Error during sign in');
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Logout initiated...');
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Error in supabase.auth.signOut():', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Supabase signOut successful');
      setUser(null);
      
      // Redirect to home page after logout
      console.log('Redirecting to home page...');
      setTimeout(() => {
        console.log('Executing redirect to home page');
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Error logging out:', JSON.stringify(error, null, 2));
      // Even if there's an error, clear the user state and redirect
      setUser(null);
      setTimeout(() => {
        console.log('Executing redirect after error');
        window.location.href = '/';
      }, 100);
    }
  };

  const value = {
    user,
    loading,
    login,
    signUp,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;