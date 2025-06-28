import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, X, AlertCircle, PauseCircle, PlayCircle, Settings, ChevronLeft, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { getInterview, startFeedbackProcessing } from '../services/InterviewService';
import { useMediaAccess } from '../hooks/useMediaAccess';
import VideoInterviewSetup from '../components/interview/VideoInterviewSetup';
import { useAuth } from '../hooks/useAuth';
import { updateConversationMinutes } from '../services/ProfileService';
import InterviewCall from '../components/interview/InterviewCall';
import BackButton from '../components/layout/BackButton';
import Breadcrumb from '../components/layout/Breadcrumb';
import { useTavusConversation } from '../hooks/useTavusConversation';

interface Question {
  id: number;
  text: string;
  hint?: string;
}

interface InterviewData {
  id: string;
  title: string;
  company?: string | null;
  role: string;
  interview_types?: {
    type: string;
    title: string;
  };
  difficulty_levels?: {
    value: string;
    label: string;
  };
  questions: Question[];
  duration: number;
  tavus_persona_id?: string;
}

const InterviewSessionContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showVideoSetup, setShowVideoSetup] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes in seconds
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [callActive, setCallActive] = useState(false);
  
  // Media access for user video/audio
  const {
    conversation,
    isLoading: tavusLoading,
    error: tavusError
  } = useTavusConversation({
    interviewType: interviewData?.interview_types?.type || 'technical',
    participantName: 'Candidate',
    role: interviewData?.role || 'Developer',
    company: interviewData?.company || undefined,
    autoStart: false // Don't auto-start, we'll start manually
  });
  
  const {
    cleanup: cleanupMedia
  } = useMediaAccess();
  
  // Handle video setup completion
  const handleVideoSetupComplete = (url: string) => {
    console.log('Video setup completed with URL:', url);
    setShowVideoSetup(false);
    setCallActive(true);
  };

  const handleVideoError = (error: string) => {
    console.error('Video error:', error);
    // Don't show error dialog for demo mode message
    if (error.includes('demo mode')) {
      console.log('Using demo mode, continuing with mock interview');
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Load interview data
  useEffect(() => {
    const fetchInterviewData = async () => {
      setLoading(true);
      try {
        if (id) {
          const data = await getInterview(id);
          setInterviewData(data);
          
          // Set timer based on interview duration if available
          if (data.duration) {
            setTimeRemaining(data.duration * 60);
          }
         
         // Check if prompt is ready
         if (data.prompt_status !== 'ready') {
           console.warn(`Interview prompt is not ready. Status: ${data.prompt_status}`);
           navigate('/dashboard');
           return;
         }
        }
      } catch (error) {
        console.error('Error fetching interview data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewData();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!loading && !isPaused && timeRemaining > 0 && callActive) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loading, isPaused, timeRemaining, callActive]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  const confirmExit = async () => {
    // Calculate actual minutes used when exiting early
    const timeElapsed = Math.ceil((interviewData?.duration * 60 - timeRemaining) / 60);
    
    // Cleanup media streams
    cleanupMedia();
    
    // Update conversation minutes with actual usage
    if (user && timeElapsed > 0) {
      try {
        await updateConversationMinutes(user.id, timeElapsed);
      } catch (error) {
        console.error('Failed to update conversation minutes on exit:', error);
      }
    }
    
    navigate('/dashboard');
  };

  const handleCallEnd = async () => {
    // Show confirmation dialog
    setShowEndCallConfirm(true);
  };

  const confirmEndCall = async () => {
    setIsEndingCall(true);
    try {
      // Close the confirmation dialog first
      setShowEndCallConfirm(false);
      
      // Calculate actual minutes used (time elapsed)
      const timeElapsed = Math.ceil((interviewData?.duration * 60 - timeRemaining) / 60);
      
      // Check if interview was too short for meaningful feedback (less than 20 seconds)
      const timeElapsedSeconds = interviewData?.duration * 60 - timeRemaining;
      if (timeElapsedSeconds < 20) {
        console.log('Interview too short for feedback generation:', timeElapsedSeconds, 'seconds');
        
        // Update interview with failed feedback status
        try {
          await supabase
            .from('interviews')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              feedback_processing_status: 'failed',
              prompt_error: 'Call duration too short for feedback generation. Minimum 20 seconds required.'
            })
            .eq('id', id);
        } catch (error) {
          console.error('Error updating interview status for short call:', error);
        }
        
        // Navigate to dashboard
        navigate('/dashboard');
        return;
      }
      
      // Set call as inactive to stop the video component
      setCallActive(false);
      
      // Cleanup media streams
      cleanupMedia();
      
      // Start feedback processing if we have a Tavus conversation
      if (conversation?.conversation_id && id && interviewData) {
        console.log('Starting feedback processing for conversation:', conversation.conversation_id);
        await startFeedbackProcessing(id, conversation.conversation_id, interviewData);
      }
      
      // Update conversation minutes with actual usage
      if (user && timeElapsed > 0) {
        try {
          await updateConversationMinutes(user.id, timeElapsed);
        } catch (error) {
          console.error('Failed to update conversation minutes:', error);
        }
      }
      
      // Navigate to dashboard to see the processing status
      navigate('/dashboard');
      
    } catch (error) {
      setIsEndingCall(false);
      setShowEndCallConfirm(false);
      
      console.error('Error ending call:', error);
      // Navigate to dashboard anyway
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-500 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-black dark:via-black dark:to-black text-gray-900 dark:text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-blue-500 mb-6"></div>
        <h2 className="text-2xl font-semibold mb-2">Preparing Your Interview</h2>
        <p className="text-gray-400 dark:text-gray-300">Setting up the AI interviewer...</p>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-500 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-black dark:via-black dark:to-black text-gray-900 dark:text-white">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Interview Not Found</h2>
        <p className="text-gray-400 dark:text-gray-300 mb-6">The interview session could not be loaded.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  // Show video setup if not completed
  if (showVideoSetup && interviewData) {
    return (
      <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-black dark:via-black dark:to-black pt-24 pb-12">
        <div className="container-custom mx-auto">
          <Breadcrumb />
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold mb-6 dark:text-white transition-colors">Interview Setup</h1>
          <VideoInterviewSetup
            interviewType={interviewData.interview_types?.type || 'technical'}
            participantName="Candidate"
            role={interviewData.role}
            company={interviewData.company || undefined}
            llmGeneratedContext={interviewData.llm_generated_context}
            llmGeneratedGreeting={interviewData.llm_generated_greeting}
            tavusPersonaId={interviewData.tavus_persona_id}
            onSetupComplete={handleVideoSetupComplete}
            onError={handleVideoError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-black dark:via-black dark:to-black text-gray-900 dark:text-white pt-0">
      {/* Top controls */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800 py-3 px-4 z-20 backdrop-blur-md transition-colors duration-500">
        <div className="container-custom mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="font-medium truncate dark:text-white">
              {interviewData.title} 
              {interviewData.company && <span className="text-gray-400 dark:text-gray-300"> • {interviewData.company}</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-300" />
              <span className={`font-medium text-base ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}> 
                {formatTime(timeRemaining)} <span className="text-gray-400 dark:text-gray-300 text-xs">/ {(interviewData.duration)}:00</span>
              </span>
            </div>
            
            <button
              onClick={togglePause}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isPaused ? "Resume interview" : "Pause interview"}
            >
              {isPaused ? (
                <PlayCircle className="h-5 w-5 text-green-500" />
              ) : (
                <PauseCircle className="h-5 w-5" />
              )}
            </button>

            <button 
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Exit interview"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main video area - now full width */}
      <div className="pt-14 sm:pt-16 min-h-screen">
        <div className="h-full p-4">
          {callActive && (
            <InterviewCall
              interviewType={interviewData.interview_types?.type || 'technical'}
              participantName="Candidate"
              role={interviewData.role}
              company={interviewData.company || undefined}
              timeRemaining={timeRemaining}
              totalDuration={(interviewData.duration ?? 20) * 60}
              conversationalContext={interviewData.llm_generated_context}
              customGreeting={interviewData.llm_generated_greeting}
              tavusPersonaId={interviewData.tavus_persona_id}
              conversationUrl={interviewData.tavus_conversation_url}
              onCallEnd={() => setShowEndCallConfirm(true)}
              onError={handleVideoError}
              className="w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]"
            />
          )}
          
          {isPaused && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/90 flex items-center justify-center transition-colors duration-500">
              <div className="text-center">
                <PauseCircle className="h-16 w-16 text-gray-900 dark:text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 dark:text-white">Interview Paused</h3>
                <p className="text-gray-400 dark:text-gray-300 mb-6">Take a moment to collect your thoughts</p>
                <Button
                  onClick={togglePause}
                  variant="interview"
                  className="flex-1 text-base"
                >
                  <PlayCircle className="h-5 w-5" />
                  Resume Interview
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End Call Confirmation Dialog */}
      {showEndCallConfirm && (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/90 flex items-center justify-center p-4 z-50 transition-colors duration-500">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: isEndingCall ? 0.95 : 1 }}
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-500 ${isEndingCall ? 'opacity-80' : ''}`}
          >
            <h3 className="text-2xl font-semibold mb-4 dark:text-white">
              {isEndingCall ? 'Ending Interview...' : 'End Interview?'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Are you sure you want to end this interview? This will complete your session and generate feedback.
            </p>
            {isEndingCall ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-700 dark:text-gray-300">Processing your interview...</span>
              </div>
            ) : (
              <div className="flex gap-6">
                <Button
                  onClick={() => setShowEndCallConfirm(false)}
                  variant="ghost"
                  className="flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600 py-6 text-lg"
                >
                  Continue Interview
                </Button>
                <Button
                  onClick={confirmEndCall}
                  variant="destructive"
                  className="flex-1 py-6 text-lg"
                >
                  End Interview
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-white/80 dark:bg-black/90 flex items-center justify-center p-4 z-50 transition-colors duration-500">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-500"
          >
            <h3 className="text-2xl font-semibold mb-4 dark:text-white">End Interview?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
              Are you sure you want to end this interview? Your progress will not be saved.
            </p>
            <div className="flex gap-6">
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="outline"
                className="flex-1 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 py-6 text-lg"
              >
                Continue Interview
              </Button>
              <Button
                onClick={confirmExit}
                variant="destructive"
                className="flex-1 py-6 text-lg"
              >
                End Interview
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
    </div>
  );
};

// Main component - now with Daily provider handled internally
const InterviewSession: React.FC = () => {
  return <InterviewSessionContent />;
};

export default InterviewSession;