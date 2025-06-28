import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusCircle, Clock, CheckCircle, XCircle, ChevronRight, Calendar, MessageSquare, Trophy, Award, Zap, BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getConversationMinutes } from '../services/ProfileService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { formatDate } from '../lib/utils';
import { getInterviews, deleteInterview, cancelInterview, retryPromptGeneration, startFeedbackProcessing } from '../services/InterviewService';
import { interviewTips } from '../data/feedback';
import InterviewCard from '../components/dashboard/InterviewCard';

// Use the same interface as InterviewCard component
interface Interview {
  id: string;
  title: string;
  company: string | null;
  role: string;
  scheduled_at: string;
  status: string;
  score?: number | null;
  duration?: number;
  prompt_status?: string;
  prompt_error?: string;
  feedback_processing_status?: string;
  tavus_conversation_id?: string | null;
  experience_levels?: {
    label: string;
  };
  difficulty_levels?: {
    label: string;
  };
  interview_types?: {
    type: string;
    title: string;
  };
  completed_at?: string;
  created_at?: string;
}

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [conversationMinutes, setConversationMinutes] = useState<{total: number, used: number, remaining: number} | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; interview: Interview | null }>({
    open: false,
    interview: null
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; interview: Interview | null }>({
    open: false,
    interview: null
  });
  const [editForm, setEditForm] = useState({
    title: '',
    company: '',
    scheduled_at: '',
    scheduled_time: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetchedData = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Function to transform API data to Interview interface
  const transformInterviewData = (apiData: any[]): Interview[] => {
    return apiData.map(item => ({
      id: item.id,
      title: item.title,
      company: item.company,
      role: item.role || '',
      scheduled_at: item.scheduled_at,
      status: item.status,
      score: item.score,
      duration: item.duration,
      prompt_status: item.prompt_status,
      prompt_error: item.prompt_error,
      feedback_processing_status: item.feedback_processing_status,
      tavus_conversation_id: item.tavus_conversation_id,
      experience_levels: item.experience_levels ? { label: item.experience_levels.label } : undefined,
      difficulty_levels: item.difficulty_levels ? { label: item.difficulty_levels.label } : undefined,
      interview_types: item.interview_types ? { type: item.interview_types.type, title: item.interview_types.title } : undefined,
      completed_at: item.completed_at,
      created_at: item.created_at
    }));
  };

  // Function to fetch interviews data
  const fetchInterviewsData = useCallback(async (showLoadingState = false) => {
    console.log('📊 Dashboard: fetchInterviewsData called', { showLoadingState, userId: user?.id });
    setFetchError(null);
    if (showLoadingState) setIsRefreshing(true);
    setDataLoading(true);
    
    // Set a timeout to force stop loading after 15 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('📊 Dashboard: Loading timeout reached, forcing stop');
      setDataLoading(false);
      setIsRefreshing(false);
    }, 15000);
    
    try {
      if (!user) throw new Error('User not found');
      console.log('📊 Dashboard: Starting API calls');
      const [data, minutes] = await Promise.all([
        getInterviews(user.id),
        getConversationMinutes(user.id),
      ]);
      console.log('📊 Dashboard: API calls completed', { dataLength: data.length, hasMinutes: !!minutes });
      
      // Clear the timeout since we got a response
      clearTimeout(loadingTimeout);
      
      // Log the raw interview data for debugging
      console.log('📊 Dashboard: Raw interview data from API:', data);
      
      setConversationMinutes(minutes);
      const transformedData = transformInterviewData(data);
      
      // Log the transformed interview data
      console.log('📊 Dashboard: Transformed interview data:', transformedData);
      
      setInterviews(transformedData);
      generateRecentActivities(transformedData);
      console.log('📊 Dashboard: Data set successfully');
      
      // Set loading to false after successful data setting
      setDataLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error('📊 Dashboard: Error in fetchInterviewsData', error);
      
      // Clear the timeout since we got an error
      clearTimeout(loadingTimeout);
      
      setFetchError('Failed to load dashboard data.');
      setInterviews([]);
      
      // Set loading to false after error
      setDataLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);
  
  // Initial data fetch
  useEffect(() => {
    console.log('📊 Dashboard: Initial useEffect for data fetch', { 
      hasUser: !!user,
      userId: user?.id,
      authLoading,
      dataLoading,
      hasFetchedData: hasFetchedData.current,
      lastUserId: lastUserIdRef.current
    });
    
    // Reset fetch state if user changes
    if (user?.id !== lastUserIdRef.current) {
      console.log('📊 Dashboard: User changed, resetting fetch state');
      hasFetchedData.current = false;
      lastUserIdRef.current = user?.id || null;
    }
    
    // Only fetch data if we have a user, auth is not loading, and we haven't fetched data yet
    if (user?.id && !authLoading && !hasFetchedData.current) {
      console.log('📊 Dashboard: Fetching data - user available, auth not loading, and data not yet fetched');
      hasFetchedData.current = true;
      setDataLoading(true);
      fetchInterviewsData(true);
    } else if (!authLoading && !user) {
      // If auth is done loading and we have no user, show empty array
      console.log('📊 Dashboard: No user after auth loaded, showing empty state');
      setInterviews([]);
      setDataLoading(false);
      hasFetchedData.current = false;
      lastUserIdRef.current = null;
    }
  }, [user?.id, authLoading, fetchInterviewsData]);
  
  // Timeout fallback: stop loading after 10s
  useEffect(() => {
    if (dataLoading) {
      const timeout = setTimeout(() => setDataLoading(false), 10000);
      return () => clearTimeout(timeout);
    }
  }, [dataLoading]);
  
  // Function to generate recent activities from interview data
  const generateRecentActivities = (interviewsData: Interview[]) => {
    // Sort interviews by most recent first
    const sortedInterviews = [...interviewsData].sort((a, b) => {
      // For completed interviews, sort by completed_at
      if (a.status === 'completed' && b.status === 'completed' && a.completed_at && b.completed_at) {
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      }
      // For other interviews, sort by created_at or scheduled_at
      const aDate = a.created_at || a.scheduled_at;
      const bDate = b.created_at || b.scheduled_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    // Take the 3 most recent interviews
    const recentInterviews = sortedInterviews.slice(0, 3);

    // Transform interviews into activity items
    const activities = recentInterviews.map(interview => {
      let activity = {
        id: interview.id,
        type: '',
        title: '',
        description: '',
        date: '',
        icon: <></>,
        iconBgColor: '',
        iconColor: '',
        link: ''
      };

      if (interview.status === 'completed') {
        // Completed interview
        activity = {
          id: interview.id,
          type: 'completion',
          title: `Completed ${interview.interview_types?.title || 'Interview'}`,
          description: `${interview.role} at ${interview.company || 'Company'}`,
          date: interview.completed_at || interview.created_at || '',
          icon: <Trophy className="h-4 w-4" />,
          iconBgColor: 'bg-success-100',
          iconColor: 'text-success-600',
          link: `/feedback/${interview.id}`
        };
      } else if (interview.status === 'scheduled') {
        // Scheduled interview
        activity = {
          id: interview.id,
          type: 'scheduled',
          title: `Scheduled ${interview.interview_types?.title || 'Interview'}`,
          description: `${interview.role} at ${interview.company || 'Company'}`,
          date: interview.scheduled_at,
          icon: <Calendar className="h-4 w-4" />,
          iconBgColor: 'bg-primary-100',
          iconColor: 'text-primary-600',
          link: `/interview/${interview.id}`
        };
      } else if (interview.status === 'canceled') {
        // Canceled interview
        activity = {
          id: interview.id,
          type: 'canceled',
          title: `Canceled ${interview.interview_types?.title || 'Interview'}`,
          description: `${interview.role} at ${interview.company || 'Company'}`,
          date: interview.created_at || '',
          icon: <XCircle className="h-4 w-4" />,
          iconBgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          link: ''
        };
      }

      return activity;
    });

    // Add some additional activity types if we have fewer than 3 interviews
    if (activities.length < 3) {
      // If user has completed interviews with scores
      const completedWithScores = sortedInterviews.filter(i => i.status === 'completed' && i.score);
      
      if (completedWithScores.length > 0) {
        // Find the interview with the highest score
        const bestInterview = completedWithScores.reduce((prev, current) => 
          (prev.score || 0) > (current.score || 0) ? prev : current
        );
        
        if (bestInterview && !activities.some(a => a.id === bestInterview.id)) {
          activities.push({
            id: `score-${bestInterview.id}`,
            type: 'achievement',
            title: `Achieved ${bestInterview.score}% Score`,
            description: `${bestInterview.role} ${bestInterview.interview_types?.title || 'Interview'}`,
            date: bestInterview.completed_at || bestInterview.created_at || '',
            icon: <Award className="h-4 w-4" />,
            iconBgColor: 'bg-accent-100',
            iconColor: 'text-accent-600',
            link: `/feedback/${bestInterview.id}`
          });
        }
      }
      
      // Add account creation activity if we still need more
      if (activities.length < 3 && user) {
        activities.push({
          id: 'account-creation',
          type: 'account',
          title: 'Account Created',
          description: 'Welcome to InterviewAI!',
          date: user.created_at || '',
          icon: <Zap className="h-4 w-4" />,
          iconBgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          link: ''
        });
      }
      
      // Add a tip activity if we still need more
      if (activities.length < 3) {
        activities.push({
          id: 'interview-tip',
          type: 'tip',
          title: 'Interview Tip',
          description: 'Practice the STAR method for behavioral questions',
          date: new Date().toISOString(),
          icon: <BookOpen className="h-4 w-4" />,
          iconBgColor: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          link: ''
        });
      }
    }

    // Limit to 3 activities and sort by date
    const finalActivities = activities
      .slice(0, 3)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setRecentActivities(finalActivities);
  };

  const upcomingInterviews = interviews.filter(
    interview => interview.status === 'scheduled'
  );
  
  const completedInterviews = interviews.filter(
    interview => interview.status === 'completed'
  );

  const handleDeleteInterview = async () => {
    if (!deleteDialog.interview) return;
    
    setActionLoading(true);
    try {
      const success = await deleteInterview(deleteDialog.interview.id);
      if (success) {
        await fetchInterviewsData();
        // Remove from local state
        setInterviews(prev => prev.filter(interview => interview.id !== deleteDialog.interview!.id));
        setDeleteDialog({ open: false, interview: null });
      } else {
        console.error('Failed to delete interview');
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditInterview = (interview: Interview) => {
    const scheduledDate = new Date(interview.scheduled_at);
    const dateStr = scheduledDate.toISOString().split('T')[0];
    const timeStr = scheduledDate.toTimeString().slice(0, 5);
    
    setEditForm({
      title: interview.title,
      company: interview.company || '',
      scheduled_at: dateStr,
      scheduled_time: timeStr
    });
    setEditDialog({ open: true, interview });
  };

  const handleSaveEdit = async () => {
    if (!editDialog.interview) return;
    
    setActionLoading(true);
    try {
      // Combine date and time
      const newDateTime = new Date(`${editForm.scheduled_at}T${editForm.scheduled_time}`);
      
      // Update local state (in a real app, you'd call an API)
      await fetchInterviewsData();
      setInterviews(prev => prev.map(interview => 
        interview.id === editDialog.interview!.id 
          ? {
              ...interview,
              title: editForm.title,
              company: editForm.company || null,
              scheduled_at: newDateTime.toISOString()
            }
          : interview
      ));
      
      setEditDialog({ open: false, interview: null });
    } catch (error) {
      console.error('Error updating interview:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInterview = async (interview: Interview) => {
    setActionLoading(true);
    try {
      const success = await cancelInterview(interview.id);
      if (success) {
        await fetchInterviewsData();
        // Update local state
        setInterviews(prev => prev.map(int => 
          int.id === interview.id 
            ? { ...int, status: 'canceled' }
            : int
        ));
      }
    } catch (error) {
      console.error('Error canceling interview:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for retrying feedback generation
  const handleRetryFeedback = async (interview: Interview) => {
    setActionLoading(true);
    try {
      if (!user) return;
      
      console.log('Retrying feedback generation for interview:', interview.id);
      
      // Use the conversation ID from the interview or fallback to a static ID
      const conversationId = interview.tavus_conversation_id || 'c2e296520d0b9402';
      
      const success = await startFeedbackProcessing(interview.id, conversationId, interview);
      
      if (success) {
        await fetchInterviewsData(true);
      }
    } catch (error) {
      console.error('Error retrying feedback generation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for retrying prompt generation
  const handleRetryPrompt = async (interview: Interview) => {
    setActionLoading(true);
    try {
      if (!user) return;
      
      console.log('Retrying prompt generation for interview:', interview.id);
      const success = await retryPromptGeneration(interview.id, user.name);
      
      if (success) {
        await fetchInterviewsData();
      }
    } catch (error) {
      console.error('Error retrying prompt generation:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Show loading state when either auth is loading or data is loading
  const isLoading = authLoading || dataLoading;
  
  if (isLoading) {
    console.log('📊 Dashboard: Rendering loading state', { authLoading, dataLoading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <video src="/loading.webm" autoPlay loop muted playsInline className="w-20 h-20 object-contain" />
      </div>
    );
  }
  
  console.log('📊 Dashboard: Rendering dashboard content', {
    upcomingInterviews: upcomingInterviews.length,
    completedInterviews: completedInterviews.length,
    conversationMinutes: conversationMinutes ? 
      `${conversationMinutes.remaining}/${conversationMinutes.total}` : 'null'
  });
  
  return (
    <div className="min-h-screen pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 relative overflow-hidden">
      {/* Full-screen fixed gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:hidden" />
        <div className="absolute inset-0 hidden dark:block bg-black" />
      </div>
      
      {/* Subtle animated bubbles */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-700/10 dark:to-purple-700/10"
            style={{
              width: Math.random() * 100 + 40,
              height: Math.random() * 100 + 40,
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              y: [0, Math.random() * 30 - 15],
              x: [0, Math.random() * 30 - 15],
              scale: [1, 1.08, 1],
              opacity: [0.10, 0.18, 0.10],
            }}
            transition={{
              duration: 16 + Math.random() * 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      <div className="container-custom mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          > 
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="space-y-2">
                <h1 className="heading-responsive font-bold">Dashboard</h1>
                <p className="body-responsive text-gray-600 dark:text-gray-400">
                  Welcome back, {user?.name || 'Guest'}! Manage your interview practice sessions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="card-responsive border border-white/40 dark:border-slate-700/60 shadow-responsive bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover-responsive">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm sm:text-base font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{upcomingInterviews.length}</div>
                <p className="text-xs sm:text-sm text-gray-500">Scheduled interviews</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="card-responsive border border-white/40 dark:border-slate-700/60 shadow-responsive bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover-responsive">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm sm:text-base font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{completedInterviews.length}</div>
                <p className="text-xs sm:text-sm text-gray-500">Completed interviews</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="card-responsive border border-white/40 dark:border-slate-700/60 shadow-responsive bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hover-responsive">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm sm:text-base font-medium">Conversation Minutes</CardTitle>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {conversationMinutes ? conversationMinutes.remaining : 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {conversationMinutes ? `${conversationMinutes.used}/${conversationMinutes.total} used` : 'No minutes available'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Main Content */}
        <div className="space-y-6 sm:space-y-8 lg:space-y-12">
          {/* Interview Management */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border border-white/40 dark:border-slate-700/60 shadow-responsive bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="card-responsive-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl">Interview Management</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Schedule and manage your interview practice sessions
                    </CardDescription>
                  </div>
                  <div className="btn-gradient-border">
                    <Button asChild className="btn-gradient">
                      <Link to="/setup" className="gap-2 inline-flex items-center">
                        <PlusCircle className="h-5 w-5" />
                        <span className="hidden sm:inline">Schedule Interview</span>
                        <span className="sm:hidden">Schedule</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Tab Navigation */}
              <div className="px-4 sm:px-6 lg:px-8 pb-4">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'upcoming'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="hidden sm:inline">Upcoming</span>
                    <span className="sm:hidden">Up</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'completed'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="hidden sm:inline">Completed</span>
                    <span className="sm:hidden">Done</span>
                  </button>
                </div>
              </div>
              
              <CardContent className="card-responsive-sm">
                {activeTab === 'upcoming' && (
                  <>
                    {upcomingInterviews.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto pr-2 space-y-3 sm:space-y-4 scrollbar-interview-cards">
                        {upcomingInterviews.map(interview => (
                          <InterviewCard
                            key={interview.id}
                            interview={interview}
                            onEdit={handleEditInterview}
                            onCancel={handleCancelInterview}
                            onDelete={(interview) => setDeleteDialog({ open: true, interview })}
                            onRetryPrompt={handleRetryPrompt}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4 text-sm sm:text-base">No upcoming interviews scheduled</p>
                        <div className="btn-gradient-border">
                          <Button asChild className="btn-gradient">
                            <Link to="/setup" className="gap-2 inline-flex items-center">
                              <PlusCircle className="h-5 w-5" />
                              <span className="hidden sm:inline">Schedule Interview</span>
                              <span className="sm:hidden">Schedule</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === 'completed' && (
                  <>
                    {completedInterviews.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto pr-2 space-y-3 sm:space-y-4 scrollbar-interview-cards">
                        {completedInterviews.map(interview => (
                          <InterviewCard
                            key={interview.id}
                            interview={interview}
                            onEdit={handleEditInterview}
                            onCancel={handleCancelInterview}
                            onDelete={(interview) => setDeleteDialog({ open: true, interview })}
                            onRetryFeedback={handleRetryFeedback}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4 text-sm sm:text-base">No completed interviews yet</p>
                        <div className="btn-gradient-border">
                          <Button asChild className="btn-gradient">
                            <Link to="/setup" className="gap-2 inline-flex items-center">
                              <PlusCircle className="h-5 w-5" />
                              <span className="hidden sm:inline">Schedule Interview</span>
                              <span className="sm:hidden">Schedule</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Recent Activities and Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card className="border border-white/40 dark:border-slate-700/60 shadow-responsive bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="card-responsive-sm">
                  <CardTitle className="text-lg sm:text-xl">Recent Activities</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Your recent interview activity</CardDescription>
                </CardHeader>
                <CardContent className="card-responsive-sm">
                  <div className="space-y-3 sm:space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-blue-100 dark:bg-slate-800/80 hover:bg-blue-200 dark:hover:bg-slate-700 transition-colors">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${activity.iconBgColor} flex items-center justify-center flex-shrink-0`}>
                            <div className={activity.iconColor}>
                              {activity.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium truncate">{activity.title}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {activity.description} • {formatDate(activity.date)}
                            </p>
                          </div>
                          {activity.link && (
                            <Link to={activity.link} className="text-primary-600 hover:text-primary-700 flex-shrink-0">
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-gray-400" />
                        <p className="text-sm sm:text-base">No recent activities yet</p>
                        <p className="text-xs sm:text-sm mt-1">Schedule your first interview to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card className="border border-white/40 dark:border-slate-700/60 shadow-responsive bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="card-responsive-sm">
                  <CardTitle className="text-lg sm:text-xl">Interview Tips</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Enhance your performance</CardDescription>
                </CardHeader>
                <CardContent className="card-responsive-sm">
                  <div className="space-y-3 sm:space-y-4">
                    {interviewTips.slice(0, 3).map((tip, index) => (
                      <div key={index} className={
                        `p-3 rounded-lg border 
                        ${index === 0 ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/80 dark:border-blue-700/60' : ''}
                        ${index === 1 ? 'bg-purple-100 border-purple-200 dark:bg-purple-900/80 dark:border-purple-700/60' : ''}
                        ${index === 2 ? 'bg-green-100 border-green-200 dark:bg-green-900/80 dark:border-green-700/60' : ''}`
                      }>
                        <p className={
                          `text-sm 
                          ${index === 0 ? 'text-blue-800 dark:text-blue-200' : ''}
                          ${index === 1 ? 'text-purple-800 dark:text-purple-200' : ''}
                          ${index === 2 ? 'text-green-800 dark:text-green-200' : ''}`
                        }>
                          <span className="font-medium block">{tip.title}</span>
                          {tip.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, interview: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interview</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.interview?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, interview: null })}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteInterview}
              disabled={actionLoading || isRefreshing}
            >
              {actionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Deleting...
                </div>
              ) : (
                'Delete Interview'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Interview Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, interview: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Interview</DialogTitle>
            <DialogDescription>
              Update the details for your interview session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
                Interview Title
              </label>
              <input
                id="edit-title"
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Frontend Developer Interview"
              />
            </div>
            
            <div>
              <label htmlFor="edit-company" className="block text-sm font-medium mb-1">
                Company (Optional)
              </label>
              <input
                id="edit-company"
                type="text"
                value={editForm.company}
                onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Google, Amazon"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium mb-1">
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={editForm.scheduled_at}
                  onChange={(e) => setEditForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="edit-time" className="block text-sm font-medium mb-1">
                  Time
                </label>
                <input
                  id="edit-time"
                  type="time"
                  value={editForm.scheduled_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialog({ open: false, interview: null })}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={actionLoading || !editForm.title || !editForm.scheduled_at || !editForm.scheduled_time}
              className="flex-1"
            >
              {actionLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fetchError && <div className="text-red-500 text-center my-4">{fetchError}</div>}
    </div>
  );
};

export default Dashboard;