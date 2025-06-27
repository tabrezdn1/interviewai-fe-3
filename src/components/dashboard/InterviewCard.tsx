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
      className={`group flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg transition-colors ${
        isUpcoming 
          ? interview.prompt_status === 'generating' 
            ? 'border-blue-200 bg-blue-50/50' 
            : interview.prompt_status === 'failed'
              ? 'border-red-200 bg-red-50/50'
              : 'border-gray-200 hover:border-primary-200 hover:bg-primary-50'
          : isCompleted
            ? 'border-gray-200 hover:border-primary-200 hover:bg-primary-50'
            : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start md:items-center gap-4 mb-3 md:mb-0 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-1 md:mt-0 ${
          isUpcoming 
            ? 'bg-warning-100' 
            : isCompleted 
              ? 'bg-success-100' 
              : 'bg-gray-100'
        }`}>
          {isUpcoming ? (
            <Calendar className="h-5 w-5 text-warning-600" />
          ) : isCompleted ? (
            <BarChart2 className="h-5 w-5 text-success-600" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-500" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium group-hover:text-primary-700 transition-colors">
              {interview.title}
            </h4>
            <InterviewStatusBadge 
              status={interview.status} 
              promptStatus={interview.prompt_status} 
              feedbackStatus={interview.feedback_processing_status}
            />
          </div>
          
          <p className="text-sm text-gray-600">{interview.company || 'No company specified'}</p>
          
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatDate(interview.scheduled_at)} at {formatTime(interview.scheduled_at)}
            </span>
          </div>
          
          {/* Interview Configuration */}
          <div className="flex items-center gap-4 mt-2">
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
            <Alert variant="destructive" className="mt-2 py-2 px-3">
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
            <Alert variant="destructive" className="mt-2 py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs">Feedback Failed</AlertTitle>
              <AlertDescription className="text-xs">
                Unable to generate feedback. Click "Retry Feedback" to try again.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isCompleted && interview.score && interview.feedback_processing_status === 'completed' && (
          <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
            Score: {interview.score}%
          </div>
        )}
        {isCompleted && interview.feedback_processing_status === 'processing' && (
          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium flex items-center gap-1">
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
            className={interview.prompt_status !== 'ready' && interview.prompt_status !== 'failed' ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Link to={`/interview/${interview.id}`} className="flex items-center gap-1">
              {interview.prompt_status === 'ready' ? (
                <>Start Interview</>
              ) : interview.prompt_status === 'failed' ? (
                <>Retry Setup</>
              ) : interview.prompt_status === 'generating' ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></div>
                  Preparing...
                </>
              ) : (
                <>Preparing...</>
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isUpcoming && (
              <>
                <DropdownMenuItem onClick={() => onEdit(interview)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Interview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCancel(interview)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Interview
                </DropdownMenuItem>
              </>
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
                Regenerate Feedback
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onDelete(interview)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Interview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default InterviewCard;