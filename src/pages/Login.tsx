import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Github, Mail } from 'lucide-react';
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
  const [formMode, setFormMode] = useState<'oauth' | 'email'>('oauth');
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const { login, signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if the URL has signup parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signup') === 'true') {
      setIsSignUp(true);
    }
    
    // Check if we're returning from an OAuth redirect
    if (location.hash && (location.hash.includes('access_token') || location.hash.includes('error'))) {
      setIsRedirecting(true);
    }
  }, [location]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);
  
  const handleOAuthLogin = async (provider: string) => {
    try {
      setError(null);
      setIsSubmitting(true);
      setIsRedirecting(true);
      await login(provider, undefined, { redirectTo: `${window.location.origin}/dashboard` });
      // Note: The page will redirect, so we don't need to navigate here
    } catch (error) {
      console.error('Login failed:', error);
      setError('Authentication failed. Please try again.');
      setIsRedirecting(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmailSignIn = async (data: { email: string; password: string }) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login('email', data);
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Sign in failed:', error);
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
      navigate('/dashboard');
    } catch (error: unknown) {
      console.error('Sign up failed:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error && error.code === 'user_already_exists') {
        setError('This email is already registered. Please sign in instead.');
        // Automatically switch to sign-in mode to help the user
        setIsSignUp(false);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <video src="/loading.webm" autoPlay loop muted playsInline className="w-20 h-20 object-contain mb-4 mx-auto" />
          <h3 className="text-lg font-medium mb-2">
            {isRedirecting ? 'Redirecting to authenticate...' : 'Loading...'}
          </h3>
          <p className="text-muted-foreground">
            {isRedirecting ? 'Please wait while we connect to your account.' : 'Please wait...'}
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
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
            
            {formMode === 'oauth' ? (
              <div className="space-y-3 sm:space-y-4">
                <Button
                  onClick={() => handleOAuthLogin('google')}
                  variant="outline"
                  className="w-full justify-center gap-3 hover:bg-blue-700 dark:hover:bg-blue-600 h-11 sm:h-12"
                  disabled={isSubmitting}
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">
                    {isSubmitting ? 'Connecting...' : 'Continue with Google'}
                  </span>
                    {isSubmitting ? 'Connecting...' : 'Continue with Google'}
                  </span>
                </Button>
                
                <Button
                  onClick={() => handleOAuthLogin('github')}
                  variant="outline"
                  className="w-full justify-center gap-3 hover:bg-slate-700 dark:hover:bg-slate-600 h-11 sm:h-12"
                  disabled={isSubmitting}
                >
                  <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">
                    {isSubmitting ? 'Connecting...' : 'Continue with GitHub'}
                  </span>
                    {isSubmitting ? 'Connecting...' : 'Continue with GitHub'}
                  </span>
                </Button>
                
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                    <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-gray-400">
                  <div className="relative flex justify-center text-xs sm:text-sm uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setFormMode('email')}
                  variant="outline"
                  className="w-full justify-center gap-3 h-11 sm:h-12"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Continue with Email</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {isSignUp ? (
                  <EmailSignUpForm 
                    onSubmit={handleEmailSignUp} 
                    isLoading={isSubmitting}
                    onCancel={() => setFormMode('oauth')}
                  />
                ) : (
                  <EmailSignInForm 
                    onSubmit={handleEmailSignIn} 
                    isLoading={isSubmitting}
                    onCancel={() => setFormMode('oauth')}
                  />
                )}
                
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-gray-400">
                  <div className="relative flex justify-center text-xs sm:text-sm uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-gray-400">
                      Or
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setFormMode('oauth')}
                  variant="outline"
                  className="w-full justify-center gap-3 h-11 sm:h-12"
                >
                  <span className="text-sm sm:text-base">Continue with OAuth</span>
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 p-6 sm:p-8 pt-0">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
            
            <div className="text-center text-xs text-gray-500 dark:text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </div>
            
            <div className="text-center text-xs text-gray-500 dark:text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      </div>
    </>
  );
};

export default Login;