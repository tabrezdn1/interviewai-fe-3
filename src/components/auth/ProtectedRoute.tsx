import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🛡️ ProtectedRoute:', { isAuthenticated, loading });
  if (loading) {
    console.log('🛡️ ProtectedRoute: Showing loading spinner');
    // You could render a loading spinner here
    return null;
  }

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('🛡️ ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;