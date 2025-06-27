import React from 'react';
import { Badge } from '../ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface InterviewStatusBadgeProps {
  status: string;
  promptStatus?: string;
  feedbackStatus?: string;
  className?: string;
}

const InterviewStatusBadge: React.FC<InterviewStatusBadgeProps> = ({ 
  status, 
  promptStatus,
  feedbackStatus,
  className = '' 
}) => {
  // For scheduled interviews, show prompt status
  if (status === 'scheduled' && promptStatus) {
    switch (promptStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className={`bg-gray-100 text-gray-700 dark:bg-gray-800/80 dark:text-gray-200 transition-colors duration-300 ${className}`}>
            <Clock className="h-3 w-3 mr-1" />
            Queued
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/70 dark:text-blue-200 dark:border-blue-800 transition-colors duration-300 ${className}`}>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Preparing
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 dark:bg-green-900/70 dark:text-green-200 dark:border-green-800 transition-colors duration-300 ${className}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800 transition-colors duration-300 ${className}`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            Setup Failed
          </Badge>
        );
      default:
        return null;
    }
  }

  // For completed interviews, show feedback status
  if (status === 'completed' && feedbackStatus) {
    switch (feedbackStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className={`bg-gray-100 text-gray-700 dark:bg-gray-800/80 dark:text-gray-200 transition-colors duration-300 ${className}`}>
            <Clock className="h-3 w-3 mr-1" />
            Feedback Queued
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/70 dark:text-blue-200 dark:border-blue-800 transition-colors duration-300 ${className}`}>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Generating Feedback
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 dark:bg-green-900/70 dark:text-green-200 dark:border-green-800 transition-colors duration-300 ${className}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Feedback Ready
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800 transition-colors duration-300 ${className}`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            Feedback Failed
          </Badge>
        );
      default:
        return null;
    }
  }
  // For other interview statuses
  switch (status) {
    case 'scheduled':
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/70 dark:text-blue-200 dark:border-blue-800 transition-colors duration-300 ${className}`}>
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 dark:bg-green-900/70 dark:text-green-200 dark:border-green-800 transition-colors duration-300 ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'canceled':
      return (
        <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 dark:bg-red-900/70 dark:text-red-200 dark:border-red-800 transition-colors duration-300 ${className}`}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Canceled
        </Badge>
      );
    default:
      return null;
  }
};

export default InterviewStatusBadge;