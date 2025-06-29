import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state only when we're loading AND not authenticated
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <video src="/loading.webm" autoPlay loop muted playsInline className="w-20 h-20 object-contain mb-4 mx-auto" />
          <h3 className="text-lg font-medium mb-2">Loading...</h3>
          <p className="text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, show protected content
  return <>{children}</>;
};

export default ProtectedRoute;