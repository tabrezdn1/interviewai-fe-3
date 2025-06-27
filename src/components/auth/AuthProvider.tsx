import React, { useEffect, useState } from 'react'
import { supabase, clearAuthTokens } from '../../lib/supabase'
import { AuthProvider as AuthContextProvider } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 AuthProvider: Initializing auth...')
      try {
        // Check if we have any auth tokens that might be invalid
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔐 AuthProvider: getSession result:', { 
          hasSession: !!session, 
          hasError: !!error,
          errorMessage: error?.message
        })
        
        if (error) {
          console.warn('Auth initialization error:', error.message)
          
          // If we get a refresh token error, clear everything and start fresh
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log('Clearing invalid auth tokens...')
            await clearAuthTokens()
          }
        }
        
        console.log('🔐 AuthProvider: Setting isInitialized to true')
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        console.log('🔐 AuthProvider: Setting isInitialized to true despite error')
        // Even if initialization fails, we should still render the app
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Show loading state while initializing
  if (!isInitialized) {
    console.log('🔐 AuthProvider: Rendering loading state (isInitialized=false)')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  console.log('🔐 AuthProvider: Rendering children (isInitialized=true)')
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  )
}

export default AuthProvider