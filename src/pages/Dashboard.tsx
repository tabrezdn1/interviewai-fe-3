import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusCircle, Clock, CheckCircle, XCircle, BarChart2, ChevronRight, Calendar,
  Award, MoreVertical, Edit, Trash2, CalendarDays, User, RefreshCw,
  MessageSquare, Zap, Trophy, BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getConversationMinutes } from '../services/ProfileService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { formatDate, formatTime } from '../lib/utils';
import { getInterviews, deleteInterview, cancelInterview, retryPromptGeneration, startFeedbackProcessing } from '../services/InterviewService';
import { interviewTips } from '../data/feedback';
import InterviewCard from '../components/dashboard/InterviewCard';

interface Interview {
  id: string;
  title: string;
  company: string | null;
  scheduled_at: string;
  status: string;
  score: number | null;
  role?: string;
  feedback_processing_status?: string;
  tavus_conversation_id?: string | null;
  interview_types?: {
    title: string;
  };
  prompt_status?: 'ready' | 'generating' | 'failed';
  duration?: number;
  experience_levels?: {
    label: string;
  };
  difficulty_levels?: {
    label: string;
  };
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isPolling, setIsPolling] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(15000); // 15 seconds
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
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
  const pollingTimerRef = useRef<number | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Function to fetch interviews data
  const fetchInterviewsData = useCallback(async (showLoadingState = false) => {
    console.log('📊 Dashboard: fetchInterviewsData called', { 
      showLoadingState, 
      userId: user?.id,
      isPolling
    });
    
    if (!user) {
      console.log('📊 Dashboard: No user, showing mock data');
      // If no user, show empty array
      setInterviews([]);
      setDataLoading(false);
      return;
    }
    
    if (showLoadingState) {
      console.log('📊 Dashboard: Setting isRefreshing to true');
      setIsRefreshing(true);
    }
    
    try {
      console.log('📊 Dashboard: Fetching interviews and minutes data');
      const [data, minutes] = await Promise.all([
        getInterviews(user.id),
        getConversationMinutes(user.id),
      ]);
      
      console.log('📊 Dashboard: Data fetched successfully', { 
        interviewsCount: data.length,
        hasMinutes: !!minutes
      });
      
      setConversationMinutes(minutes);
      
      // Set interviews data from database
      setInterviews(data);

      // Generate recent activities from interview data
      generateRecentActivities(data);
      
      // Update last refreshed timestamp
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
      console.log('📊 Dashboard: Error fetching data, using mock data as fallback');
      // Use empty array as fallback
      setInterviews([]);
    } finally {
      console.log('📊 Dashboard: Setting loading state to false');
      setDataLoading(false);
      if (showLoadingState) {
        console.log('📊 Dashboard: Setting isRefreshing to false');
        setIsRefreshing(false);
      }
    }
  }, [user]);
  
  // Initial data fetch
  useEffect(() => {
    console.log('📊 Dashboard: Initial useEffect for data fetch');
    // Only fetch data if we have a user and auth is not loading
    if (user && !authLoading) {
      setDataLoading(true);
      fetchInterviewsData(true);
    } else if (!authLoading && !user) {
      // If auth is done loading and we have no user, show empty array
      setInterviews([]);
      setDataLoading(false);
    }
  }, [fetchInterviewsData, user, authLoading]);
  
  // Set up polling
  useEffect(() => {
    console.log('📊 Dashboard: Setting up polling', { isPolling, userId: user?.id });
    // Clear any existing interval
    if (pollingTimerRef.current) {
      console.log('📊 Dashboard: Clearing existing polling interval');
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    
    // Set up new interval if polling is enabled
    if (isPolling && user) {
      console.log(`📊 Dashboard: Starting polling interval (${pollingInterval}ms)`);
      pollingTimerRef.current = window.setInterval(() => {
        console.log('Polling: Fetching updated interview data...');
        fetchInterviewsData();
      }, pollingInterval);
    }
    
    // Cleanup function
    return () => {
      if (pollingTimerRef.current) {
        console.log('📊 Dashboard: Cleaning up polling interval on unmount');
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isPolling, pollingInterval, fetchInterviewsData, user]);
  
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
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
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden">
      {/* Full-screen fixed gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Light theme: soft blue/purple gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:hidden" />
        {/* Dark theme: pure black background only */}
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
        {/* Add a hidden debug panel that can be shown with a keyboard shortcut */}
        <div id="debug-panel" className="hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 max-h-64 overflow-auto text-xs">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>User: {user ? `${user.name} (${user.id})` : 'Not logged in'}</p>
          <p>Auth: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
          <p>Loading: {isLoading ? 'True' : 'False'}</p>
          <p>Refreshing: {isRefreshing ? 'True' : 'False'}</p>
          <p>Polling: {isPolling ? `Active (${pollingInterval}ms)` : 'Inactive'}</p>
          <p>Last Refreshed: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Never'}</p>
          <p>Interviews: {interviews.length} total ({upcomingInterviews.length} upcoming, {completedInterviews.length} completed)</p>
          <p>Minutes: {conversationMinutes ? `${conversationMinutes.used}/${conversationMinutes.total} (${conversationMinutes.remaining} remaining)` : 'Not loaded'}</p>
        </div>
        
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          > 
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back, {user?.name || 'Guest'}! Manage your interview practice sessions.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchInterviewsData(true)}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-blue-700 dark:hover:bg-blue-600">Auto-refresh</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsPolling(!isPolling)}>
                      {isPolling ? '✓ Enabled (15s)' : '○ Disabled'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs text-gray-500">{lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString()}` : 'Not yet refreshed'}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-primary-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{upcomingInterviews.length}</div>
                <p className="text-xs text-gray-500">Scheduled interviews</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-success-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedInterviews.length}</div>
                <p className="text-xs text-gray-500">Completed interviews</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Conversation Minutes</CardTitle>
                <Clock className="h-4 w-4 text-accent-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-baseline gap-1">
                  {conversationMinutes?.remaining || 0}
                  <span className="text-sm text-gray-500 font-normal">/ {conversationMinutes?.total || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Minutes remaining</p>
                {conversationMinutes && conversationMinutes.remaining < 30 && (
                  <div className="mt-2 text-xs text-amber-600">
                    Low on minutes! <Link to="/pricing" className="underline">Upgrade</Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-8"
        >
          <Link to="/setup">
            <div className="group relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600"></div>
              
              {/* Animated background patterns */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute bg-white rounded-full"
                    style={{
                      width: Math.random() * 100 + 50,
                      height: Math.random() * 100 + 50,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.5 + 0.1,
                    }}
                  ></div>
                ))}
              </div>
              
              <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
                <div>
                  <Badge variant="default" className="bg-white/20 text-white border-none mb-3">Start Interview</Badge>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white">Ready for your next interview?</h3>
                  <p className="text-white/90 max-w-lg">
                    Set up a new interview simulation with our AI and prepare for success. 
                    You have {conversationMinutes?.remaining || 0} minutes remaining.
                  </p>
                </div>
                <Button 
                  variant="white" 
                  size="lg" 
                  className="mt-4 md:mt-0 font-medium bg-gradient-to-r from-blue-500 to-indigo-600  border-0 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <span className="text-white">Schedule</span>
                  <PlusCircle className="ml-2 h-4 w-4 text-white group-hover:rotate-90 transition-transform" />
                </Button>
              </div>
            </div>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="overflow-hidden border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  className={`px-6 py-4 font-medium text-sm ${
                    activeTab === 'upcoming'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                      : 'text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-400'
                  }`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming Interviews
                </button>
                <button
                  className={`px-6 py-4 font-medium text-sm ${
                    activeTab === 'completed'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                      : 'text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-400'
                  }`}
                  onClick={() => setActiveTab('completed')}
                >
                  Completed Interviews
                </button>
              </div>
            </div>
            
            <CardContent className="p-6">
              {activeTab === 'upcoming' && (
                <>
                  {upcomingInterviews.length > 0 ? (
                    <div className="space-y-4">
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
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-4">No upcoming interviews scheduled</p>
                      <Button asChild className="hover:bg-blue-700 dark:hover:bg-blue-600">
                        <Link to="/setup" className="gap-2 inline-flex items-center">
                          <PlusCircle className="h-4 w-4" /> Schedule
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'completed' && (
                <>
                  {completedInterviews.length > 0 ? (
                    <div className="space-y-4">
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
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-4">No completed interviews yet</p>
                      <Button asChild className="hover:bg-blue-700 dark:hover:bg-blue-600">
                        <Link to="/setup" className="gap-2 inline-flex items-center">
                          <PlusCircle className="h-4 w-4" /> Schedule
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activities and Tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="md:col-span-2 border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Your recent interview activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-100 dark:bg-slate-800/80 hover:bg-blue-200 dark:hover:bg-slate-700 transition-colors">
                        <div className={`w-8 h-8 rounded-full ${activity.iconBgColor} flex items-center justify-center`}>
                          <div className={activity.iconColor}>
                            {activity.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {activity.description} • {formatDate(activity.date)}
                          </p>
                        </div>
                        {activity.link && (
                          <Link to={activity.link} className="text-primary-600 hover:text-primary-700">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No recent activities yet</p>
                      <p className="text-sm mt-1">Schedule your first interview to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-white/40 dark:border-slate-700/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Interview Tips</CardTitle>
                <CardDescription>Enhance your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
          </div>
        </motion.div>
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
    </div>
  );
};

export default Dashboard;