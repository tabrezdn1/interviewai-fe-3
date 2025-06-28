import React, { useEffect, useState } from 'react'
import { supabase, clearAuthTokens } from '../../lib/supabase'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  )
}

export default AuthProvider