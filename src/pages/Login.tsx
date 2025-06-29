import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import EmailSignInForm from '../components/auth/EmailSignInForm';
import EmailSignUpForm from '../components/auth/EmailSignUpForm';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if the URL has signup parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsSignUp(params.get('signup') === 'true');
  }, [location.search]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);
  
  const handleOAuthLogin = async (provider: string) => {
    try {
      await login(provider, undefined, { redirectTo: `${window.location.origin}/dashboard` });
      // OAuth will redirect automatically, so we don't need to navigate here
    } catch {
      setError('Authentication failed. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const handleEmailSignIn = async (data: { email: string; password: string }) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login('email', data);
      // The useEffect above will handle navigation when isAuthenticated becomes true
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmailSignUp = async (data: { email: string; password: string; name: string }) => {
    setError(null);
    setIsSubmitting(true);
    
    try {
      await signUp(data);
      // The useEffect above will handle navigation when isAuthenticated becomes true
    } catch (error: unknown) {
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error && error.code === 'user_already_exists') {
        setError('This email is already registered. Please sign in instead.');
        setIsSignUp(false);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading spinner while authenticating or submitting
  if (loading || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isSubmitting ? 'Signing you in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-14 sm:pt-16 lg:pt-20 flex items-center justify-center px-4 sm:px-6 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        {/* Glassmorphism blurred layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[80vw] h-[70vh] sm:h-[60vh] rounded-2xl sm:rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-2xl" />
          {/* Subtle animated bubbles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-700/10 dark:to-purple-700/10"
              style={{
                width: Math.random() * 120 + 60,
                height: Math.random() * 120 + 60,
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 90}%`,
              }}
              animate={{
                y: [0, Math.random() * 40 - 20],
                x: [0, Math.random() * 40 - 20],
                scale: [1, 1.1, 1],
                opacity: [0.12, 0.22, 0.12],
              }}
              transition={{
                duration: 12 + Math.random() * 8,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm sm:max-w-md z-10"
        >
          <Card className="border border-white/40 dark:border-slate-700/60 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-1 p-6 sm:p-8">
              <div className="flex justify-center mb-4">
                <img
                  src="/interviewai-logo.png"
                  alt="InterviewAI Logo"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full bg-primary/10"
                  style={{ display: 'block' }}
                />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {isSignUp 
                  ? 'Sign up to start practicing interviews with AI' 
                  : 'Sign in to continue your interview practice'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              {/* Email form always shown first */}
              <div className="space-y-3 sm:space-y-4 mb-6">
                {isSignUp ? (
                  <EmailSignUpForm 
                    onSubmit={handleEmailSignUp} 
                    isLoading={isSubmitting}
                  />
                ) : (
                  <EmailSignInForm 
                    onSubmit={handleEmailSignIn} 
                    isLoading={isSubmitting}
                  />
                )}
              </div>

              {/* Divider */}
              <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* OAuth buttons */}
              <div className="space-y-3 sm:space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isSubmitting}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isSubmitting}
                >
                  <Github className="w-4 h-4 mr-2" />
                  Continue with GitHub
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="text-center p-6 sm:p-8">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Login;