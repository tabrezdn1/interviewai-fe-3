import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription_tier?: string;
  total_conversation_minutes?: number;
  used_conversation_minutes?: number;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Add logging to track when useAuth is called and what it returns
  console.log('🔒 useAuth hook called', { 
    isAuthenticated: context?.isAuthenticated, 
    loading: context?.loading,
    hasUser: !!context?.user
  });
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};