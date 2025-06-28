import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🛡️ ProtectedRoute:', { isAuthenticated, loading });
  if (loading) {
    console.log('🛡️ ProtectedRoute: Showing loading spinner');
    // You could render a loading spinner here
    return (
      <div className="min-h-screen flex items-center justify-center">
        <video src="/loading.webm" autoPlay loop muted playsInline className="w-20 h-20 object-contain" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('🛡️ ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;