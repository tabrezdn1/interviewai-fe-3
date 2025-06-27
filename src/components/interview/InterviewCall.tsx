import React, { useState, useEffect } from 'react';
import { DailyProvider } from '@daily-co/daily-react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, PhoneOff } from 'lucide-react';
import { Button } from '../ui/button';
import { useTavusConversation } from '../../hooks/useTavusConversation';
import TavusVideoCall from './TavusVideoCall';

interface InterviewCallProps {
  interviewType: string;
  participantName: string;
  role: string;
  company?: string;
  timeRemaining?: number;
  totalDuration?: number;
  conversationalContext?: string;
  customGreeting?: string;
  tavusPersonaId?: string;
  conversationUrl?: string;
  conversationalContext?: string;
  customGreeting?: string;
  tavusPersonaId?: string;
  onCallEnd: () => void;
  onError: (error: string) => void;
  className?: string;
}

const InterviewCall: React.FC<InterviewCallProps> = ({
  interviewType,
  participantName,
  role,
  company,
  timeRemaining,
  totalDuration,
  conversationalContext,
  customGreeting,
  tavusPersonaId,
  conversationUrl,
  onCallEnd,
  onError,
  className = ''
}) => {
  const [callState, setCallState] = useState<'initializing' | 'ready' | 'connecting' | 'connected' | 'ended'>('initializing');
  
  const {
    conversation,
    isLoading,
    error,
    startConversation,
    endConversation
  } = useTavusConversation({
    interviewType,
    participantName,
    role,
    company,
   conversationalContext,
   customGreeting,
   tavusPersonaId,
    conversationalContext,
    customGreeting,
    tavusPersonaId,
    autoStart: !conversationUrl // Only auto-start if we don't have a pre-generated URL
  });

  // If we have a pre-generated conversation URL, use it directly
  const [preGeneratedConversation, setPreGeneratedConversation] = useState<TavusConversation | null>(null);
  
  useEffect(() => {
    if (conversationUrl && !conversation && !isLoading) {
      console.log('Using pre-generated conversation URL:', conversationUrl);
      
      // Extract conversation ID from URL if possible
      const urlParts = conversationUrl.split('/');
      const possibleId = urlParts[urlParts.length - 1];
      
      // Create a conversation object from the URL
      const conversationObj = {
        conversation_id: possibleId || `pre-generated-${Date.now()}`,
        conversation_url: conversationUrl,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      setPreGeneratedConversation(conversationObj);
      setCallState('ready');
    }
  }, [conversationUrl, conversation, isLoading]);

  // Use either the pre-generated conversation or the one from the hook
  const activeConversation = conversation || preGeneratedConversation;
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Interview call error:', error);
      onError(error);
    }
  }, [error, onError]);

  // Handle conversation state changes
  useEffect(() => {
    if (activeConversation && callState === 'initializing') {
      setCallState('ready');
    }
  }, [activeConversation, callState]);

  const handleStartCall = () => {
    setCallState('connecting');
  };

  const handleCallConnected = () => {
    setCallState('connected');
  };

  const handleLeaveCall = async () => {
    // Just trigger the confirmation dialog - don't end the call yet
    onCallEnd();
  };

  // Show loading state
  if (isLoading || callState === 'initializing') {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-xl ${className}`}>
        <div className="text-center text-white p-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Preparing AI Interviewer...
          </h3>
          <p className="text-gray-300 text-sm">
            Connecting to your personalized AI interviewer
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !activeConversation) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 rounded-xl ${className}`}>
        <div className="text-center text-white p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-gray-300 text-sm mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-gray-900"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show ready state - user needs to click to start
  if (activeConversation && callState === 'ready') {
    return (
      <div className={`flex items-center justify-center min-h-[70vh] transition-colors duration-500 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-black dark:via-black dark:to-black rounded-xl ${className}`}>
        <div className="text-center p-12 max-w-lg">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 dark:from-blue-700 dark:to-purple-700 animate-pulse"></div>
            <div className="relative w-full h-full rounded-full bg-white/10 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-blue-900 flex items-center justify-center">
              <PhoneOff className="h-8 w-8 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent transition-colors">Ready to Connect</h3>
          <p className="text-gray-600 dark:text-gray-300 text-base mb-6 leading-relaxed transition-colors">
            Your AI interviewer is ready and waiting. Click below to begin your interview session.
          </p>
          
          <Button 
            onClick={handleStartCall}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-purple-700 hover:from-blue-600 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-purple-800 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              Start Interview
              <div className="w-2 h-2 rounded-full bg-white dark:bg-blue-300 animate-pulse"></div>
            </span>
          </Button>
        </div>
      </div>
    );
  }

  // Show connecting or connected state with DailyProvider
  if (activeConversation && (callState === 'connecting' || callState === 'connected')) {
    return (
      <DailyProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          <TavusVideoCall 
            conversationUrl={activeConversation.conversation_url}
            participantName={participantName}
            timeRemaining={timeRemaining}
            totalDuration={totalDuration}
            onLeave={handleLeaveCall}
            onConnected={handleCallConnected}
            className="w-full h-full" 
          />
        </motion.div>
      </DailyProvider>
    );
  }

  // Fallback
  return (
    <div className={`flex items-center justify-center bg-gray-800 rounded-xl ${className}`}>
      <div className="text-center text-white p-8">
        <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unexpected State</h3>
        <p className="text-gray-300 text-sm mb-4">
          Something went wrong. Please try refreshing the page.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="text-white border-white hover:bg-white hover:text-gray-900"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default InterviewCall;