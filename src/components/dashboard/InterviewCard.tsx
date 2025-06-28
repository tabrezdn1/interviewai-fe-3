import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, BarChart2, User, MoreVertical, Edit, RefreshCw,
  XCircle, Trash2, ChevronRight, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { formatDate, formatTime } from '../../lib/utils';
import InterviewStatusBadge from './InterviewStatusBadge';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

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
}

interface InterviewCardProps {
  interview: Interview;
  onEdit: (interview: Interview) => void;
  onCancel: (interview: Interview) => void;
  onDelete: (interview: Interview) => void;
  onRetryFeedback?: (interview: Interview) => void;
  onRetryPrompt?: (interview: Interview) => void;
}

const InterviewCard: React.FC<InterviewCardProps> = ({
  interview,
  onEdit,
  onCancel,
  onDelete,
  onRetryFeedback,
  onRetryPrompt
}) => {
  const isUpcoming = interview.status === 'scheduled';
  const isCompleted = interview.status === 'completed';
  const hasPromptError = interview.prompt_status === 'failed';
  const hasFeedbackError = interview.feedback_processing_status === 'failed';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-6 border rounded-responsive transition-colors
        ${isUpcoming && interview.prompt_status === 'generating' ? 'border-blue-200 bg-blue-50/80 dark:bg-blue-900/80 dark:border-blue-700/60' :
          isUpcoming && interview.prompt_status === 'failed' ? 'border-red-200 bg-red-50/80 dark:bg-red-900/80 dark:border-red-700/60' :
          isUpcoming ? 'border-white/40 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 hover:border-blue-200 hover:bg-blue-50/60 dark:hover:bg-blue-900/60 dark:hover:border-blue-700/60' :
          isCompleted ? 'border-white/40 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 hover:border-blue-200 hover:bg-blue-50/60 dark:hover:bg-blue-900/60 dark:hover:border-blue-700/60' :
          'border-white/40 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60'}
      `}
    >
      <div className="flex items-start lg:items-center gap-3 sm:gap-4 mb-4 lg:mb-0 flex-1">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mt-1 lg:mt-0 flex-shrink-0 ${
          isUpcoming 
            ? 'bg-yellow-100 dark:bg-yellow-900/60' 
            : isCompleted 
              ? 'bg-green-100 dark:bg-green-900/60' 
              : 'bg-gray-100 dark:bg-slate-800/80'
        }`}>
          {isUpcoming ? (
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-warning-600" />
          ) : isCompleted ? (
            <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-success-600" />
          ) : (
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h4 className="font-medium group-hover:text-primary-700 transition-colors text-sm sm:text-base truncate">
              {interview.title}
            </h4>
            <InterviewStatusBadge 
              status={interview.status} 
              promptStatus={interview.prompt_status} 
              feedbackStatus={interview.feedback_processing_status}
            />
          </div>
          
          <p className="text-xs sm:text-sm text-gray-600 mb-2">{interview.company || 'No company specified'}</p>
          
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600">
              {formatDate(interview.scheduled_at)} at {formatTime(interview.scheduled_at)}
            </span>
          </div>
          
          {/* Interview Configuration */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{interview.duration || 20} min</span>
            </div>
            {interview.experience_levels && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{interview.experience_levels.label}</span>
              </div>
            )}
            {interview.difficulty_levels && (
              <div className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{interview.difficulty_levels.label}</span>
              </div>
            )}
          </div>
          
          {/* Error message if prompt generation failed */}
          {hasPromptError && interview.prompt_error && (
            <Alert variant="destructive" className="mt-3 py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Setup Failed</AlertTitle>
              <AlertDescription className="text-xs">
                {interview.prompt_error.length > 100 
                  ? `${interview.prompt_error.substring(0, 100)}...` 
                  : interview.prompt_error}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error message if feedback generation failed */}
          {hasFeedbackError && isCompleted && (
            <Alert variant="destructive" className="mt-3 py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Feedback Failed</AlertTitle>
              <AlertDescription className="text-xs">
                Unable to generate feedback. Click "Retry Feedback" to try again.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative">
        {isCompleted && interview.score && interview.feedback_processing_status === 'completed' && (
          <div className="px-2 py-1 bg-green-600 text-white dark:bg-green-500 dark:text-slate-900 rounded text-xs sm:text-sm font-medium shadow-sm">
            Score: {interview.score}%
          </div>
        )}
        {isCompleted && interview.feedback_processing_status === 'processing' && (
          <div className="px-2 py-1 bg-blue-600 text-white dark:bg-blue-400 dark:text-slate-900 rounded text-xs sm:text-sm font-medium flex items-center gap-1 shadow-sm">
            <div className="h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            <span>Processing...</span>
          </div>
        )}
        
        {isUpcoming && (
          <Button 
            asChild 
            variant="default" 
            size="sm"
            disabled={interview.prompt_status !== 'ready' && interview.prompt_status !== 'failed'}
            className={`${interview.prompt_status !== 'ready' && interview.prompt_status !== 'failed' ? 'opacity-50 cursor-not-allowed' : ''} w-full sm:w-auto`}
          >
            <Link to={`/interview/${interview.id}`} className="flex items-center gap-1 justify-center">
              {interview.prompt_status === 'ready' ? (
                <>
                  <span className="hidden sm:inline">Start Interview</span>
                  <span className="sm:hidden">Start</span>
                </>
              ) : interview.prompt_status === 'failed' ? (
                <>
                  <span className="hidden sm:inline">Retry Setup</span>
                  <span className="sm:hidden">Retry</span>
                </>
              ) : interview.prompt_status === 'generating' ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></div>
                  <span className="hidden sm:inline">Preparing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Preparing...</span>
                  <span className="sm:hidden">...</span>
                </>
              )}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        
        {isCompleted && (
          <Button 
            asChild 
            variant="outline" 
            size="sm"
            disabled={interview.feedback_processing_status === 'processing'}
            className={interview.feedback_processing_status === 'processing' ? 'opacity-70' : ''}
          >
            <Link to={`/feedback/${interview.id}`} className="flex items-center gap-1">
              {interview.feedback_processing_status === 'processing' ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></div>
                  Processing...
                </>
              ) : (
                <>View Feedback</>
              )}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        
        <div className="absolute right-3 top-3 sm:static sm:right-auto sm:top-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(interview)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {isUpcoming && (
                <DropdownMenuItem onClick={() => onCancel(interview)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
              {hasPromptError && onRetryPrompt && (
                <DropdownMenuItem onClick={() => onRetryPrompt(interview)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Setup
                </DropdownMenuItem>
              )}
              {isCompleted && onRetryFeedback && (
                <DropdownMenuItem onClick={() => onRetryFeedback(interview)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(interview)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

export default InterviewCard;