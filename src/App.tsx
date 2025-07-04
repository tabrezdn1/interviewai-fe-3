import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import FeedbackAnalysis from './pages/FeedbackAnalysis';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Billing from './pages/Billing';

import AuthProvider from './context/AuthContext';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import { useAuth } from './hooks/useAuth';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // Optionally, show a spinner here
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  // Add keyboard shortcut to toggle debug panel visibility
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
          debugPanel.classList.toggle('hidden');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground font-sans relative">
          {/* Always-present dark background to prevent any white flashes */}
          <div className="fixed inset-0 bg-white dark:bg-black -z-10" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Routes>
              <Route path="/" element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/settings" 
                element={
                  <AuthenticatedLayout showBackButton={false} showBreadcrumb={false}>
                    <Settings />
                  </AuthenticatedLayout>
                } 
              />
              <Route 
                path="/pricing" 
                element={
                  <AuthenticatedLayout showBackButton={false} showBreadcrumb={false}>
                    <Pricing />
                  </AuthenticatedLayout>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <AuthenticatedLayout showBackButton={false} showBreadcrumb={false}>
                    <Billing />
                  </AuthenticatedLayout>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <AuthenticatedLayout showBackButton={false}>
                    <Dashboard />
                  </AuthenticatedLayout>
                } 
              />
              <Route 
                path="/setup" 
                element={
                  <AuthenticatedLayout showBackButton={false} showBreadcrumb={false}>
                    <InterviewSetup />
                  </AuthenticatedLayout>
                } 
              />
              <Route 
                path="/interview/:id" 
                element={
                  <AuthenticatedLayout showBackButton={false} showBreadcrumb={false} fullScreen={true}>
                    <InterviewSession />
                  </AuthenticatedLayout>
                } 
              />
              <Route 
                path="/feedback/:id" 
                element={
                  <AuthenticatedLayout showBackButton={false} showBreadcrumb={false}>
                    <FeedbackAnalysis />
                  </AuthenticatedLayout>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;