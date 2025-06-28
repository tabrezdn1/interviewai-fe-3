import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, X, AlertCircle, PauseCircle, PlayCircle, Settings
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { getInterview, startFeedbackProcessing, completeInterview } from '../services/InterviewService';
import { useMediaAccess } from '../hooks/useMediaAccess';
import VideoInterviewSetup from '../components/interview/VideoInterviewSetup';
import { useAuth } from '../hooks/useAuth';
import { updateConversationMinutes } from '../services/ProfileService';
import InterviewCall from '../components/interview/InterviewCall';
import Breadcrumb from '../components/layout/Breadcrumb';
import { useTavusConversation } from '../hooks/useTavusConversation';
import { supabase } from '../lib/supabase';

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
  tavus_persona_id?: string | null;
  llm_generated_context?: string | null;
  llm_generated_greeting?: string | null;
  tavus_conversation_url?: string | null;
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

  const handleCompleteInterview = async (actualMinutesUsed?: number) => {
    try {
      if (id && interviewData) {
        // Calculate actual time elapsed in seconds
        const timeElapsed = (interviewData.duration || 20) * 60 - timeRemaining;
        
        // Convert to minutes (rounded up)
        const minutesUsed = actualMinutesUsed || Math.ceil(timeElapsed / 60);
        
        // Check if interview was too short for meaningful feedback (less than 20 seconds)
        if (timeElapsed < 20) {
          console.log('Interview too short for feedback generation:', timeElapsed, 'seconds');
          
          // Update interview with failed feedback status
          // Check if Supabase is configured
          const url = import.meta.env.VITE_SUPABASE_URL;
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const isConfigured = !!(url && key && url !== 'your-supabase-url' && url.startsWith('http') && key !== 'your-supabase-anon-key');
          
          if (isConfigured) {
            await supabase
              .from('interviews')
              .update({ 
                status: 'completed',
                completed_at: new Date().toISOString(),
                feedback_processing_status: 'failed',
                prompt_error: 'Call duration too short for feedback generation. Minimum 20 seconds required.'
              })
              .eq('id', id);
          }
          
          // Navigate to dashboard instead of feedback page
          navigate('/dashboard');
          return;
        }
        
        // Use actual minutes used or full duration
        
        // Start feedback processing if we have a Tavus conversation
        if (conversation?.conversation_id) {
          console.log('Starting feedback processing for conversation:', conversation.conversation_id);
          const feedbackStarted = await startFeedbackProcessing(id, conversation.conversation_id, interviewData);
          if (!feedbackStarted) {
            console.warn('Failed to start feedback processing, but continuing...');
          }
        } else {
          console.warn('No Tavus conversation ID available for feedback processing');
        }
        
        // Prepare mock feedback data
        const feedbackData = {
          overallScore: Math.floor(Math.random() * 30) + 70,
          questions: Object.entries(responses).map(([qIndex, response]) => {
            const questionIndex = Number(qIndex);
            const question = interviewData.questions[questionIndex];
            return {
              id: question.id,
              text: question.text,
              answer: response,
              score: Math.floor(Math.random() * 30) + 70,
              analysis: "The candidate showed good understanding of the topic.",
              feedback: "Consider providing more concrete examples next time."
            };
          }),
          feedback: {
            summary: "Overall good performance with room for improvement in specific areas.",
            overallScore: Math.floor(Math.random() * 30) + 70,
            strengths: ["Clear communication", "Good technical knowledge", "Structured answers"],
            improvements: ["More detailed examples", "Deeper technical explanations"],
            skillAssessment: {
              technical: { score: Math.floor(Math.random() * 30) + 70, feedback: "Good technical foundation." },
              communication: { score: Math.floor(Math.random() * 30) + 70, feedback: "Clear communication skills." },
              problemSolving: { score: Math.floor(Math.random() * 30) + 70, feedback: "Solid problem-solving approach." },
              experience: { score: Math.floor(Math.random() * 30) + 70, feedback: "Good experience demonstration." }
            }
          }
        };
        
        await completeInterview(id, feedbackData);
        
        // Update conversation minutes with actual usage if not already done
        if (user && !actualMinutesUsed) {
          try {
            await updateConversationMinutes(user.id, minutesUsed);
          } catch (error) {
            console.error('Failed to update conversation minutes:', error);
          }
        }
      }
      
      // Navigate to dashboard instead of feedback page
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing interview:', error);
      // Navigate to dashboard even if there's an error
      navigate('/dashboard');
    }
  };
  

  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  const confirmExit = async () => {
    // Calculate actual minutes used when exiting early
    const timeElapsed = Math.ceil(((interviewData?.duration || 20) * 60 - timeRemaining) / 60);
    
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
    try {
      console.log('🎯 InterviewSession: confirmEndCall - Starting interview completion process');
      // Close the confirmation dialog first
      setShowEndCallConfirm(false);
      
      // Calculate actual minutes used (time elapsed)
      const timeElapsed = Math.ceil(((interviewData?.duration || 20) * 60 - timeRemaining) / 60);
      console.log('🎯 InterviewSession: confirmEndCall - Time elapsed:', timeElapsed, 'minutes');
      
      
      // Set call as inactive to stop the video component
      setCallActive(false);
      console.log('🎯 InterviewSession: confirmEndCall - Set call as inactive');
      
      // Cleanup media streams
      cleanupMedia();
      console.log('🎯 InterviewSession: confirmEndCall - Cleaned up media streams');
      
      
      
      // Update conversation minutes with actual usage
      if (user && timeElapsed > 0) {
        try {
          console.log('🎯 InterviewSession: confirmEndCall - Updating conversation minutes:', timeElapsed);
          await updateConversationMinutes(user.id, timeElapsed);
          console.log('🎯 InterviewSession: confirmEndCall - Successfully updated conversation minutes');
        } catch (error) {
          console.error('Failed to update conversation minutes:', error);
        }
      }
      
      // Small delay to ensure video component cleanup, then proceed to complete the interview
      setTimeout(() => {
        handleCompleteInterview(timeElapsed);
      }, 1000);
      
    } catch (error) {
      setIsEndingCall(false);
      setShowEndCallConfirm(false);
      
      console.error('Error ending call:', error);
      console.log('🎯 InterviewSession: confirmEndCall - Error occurred, navigating to dashboard anyway');
      // Still proceed to complete the interview
      handleCompleteInterview();
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
    <div className="h-screen w-screen overflow-hidden transition-colors duration-500 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-black dark:via-black dark:to-black text-gray-900 dark:text-white">
      {/* Top controls - Responsive header */}
      
      
      {/* Main video area - Full screen without scroll */}
      <div className="absolute inset-0 top-14 sm:top-16 lg:top-20">
        <div className="h-full w-full p-2 sm:p-4">
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
              className="w-full h-full"
            />
          )}
          
          {/* Pause overlay - Full screen */}
          {isPaused && (
            <div className="absolute inset-0 bg-white/90 dark:bg-black/95 flex items-center justify-center transition-colors duration-500 z-30">
              <div className="text-center p-4 sm:p-8 max-w-sm sm:max-w-md">
                <PauseCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-900 dark:text-white mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 dark:text-white">Interview Paused</h3>
                <p className="text-gray-400 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">Take a moment to collect your thoughts</p>
                <Button
                  onClick={togglePause}
                  className="w-full sm:w-auto px-6 py-2 sm:py-3 text-sm sm:text-base"
                >
                  <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Resume Interview
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End Call Confirmation Dialog - Responsive */}
      {showEndCallConfirm && (
        <div className="fixed inset-0 bg-white/90 dark:bg-black/95 flex items-center justify-center p-3 sm:p-4 z-50 transition-colors duration-500">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-500"
          >
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 dark:text-white">End Interview?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
              Are you sure you want to end this interview? This will complete your session and generate feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <Button
                onClick={() => setShowEndCallConfirm(false)}
                variant="ghost"
                className="flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600 py-3 sm:py-4 text-sm sm:text-base"
              >
                Continue Interview
              </Button>
              <Button
                onClick={confirmEndCall}
                variant="destructive"
                className="flex-1 py-3 sm:py-4 text-sm sm:text-base"
              >
                End Interview
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Exit confirmation modal - Responsive */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-white/90 dark:bg-black/95 flex items-center justify-center p-3 sm:p-4 z-50 transition-colors duration-500">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-500"
          >
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 dark:text-white">End Interview?</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
              Are you sure you want to end this interview? Your progress will not be saved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="outline"
                className="flex-1 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 py-3 sm:py-4 text-sm sm:text-base"
              >
                Continue Interview
              </Button>
              <Button
                onClick={confirmExit}
                variant="destructive"
                className="flex-1 py-3 sm:py-4 text-sm sm:text-base"
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