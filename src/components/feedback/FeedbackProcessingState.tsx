import React from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, Info, CheckCircle, Clock, FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface FeedbackProcessingStateProps {
  title?: string;
  onReturnToDashboard: () => void;
}

const FeedbackProcessingState: React.FC<FeedbackProcessingStateProps> = ({ 
  title = 'Your interview',
  onReturnToDashboard
}) => {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-full h-full">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mb-3">Generating Your Feedback</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Our AI is analyzing your interview responses and preparing detailed feedback. This process typically takes 3-5 minutes.
          </p>
          
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-6">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left max-w-md mx-auto">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  You can safely leave this page and come back later. We'll send you a notification when your feedback is ready.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="font-medium text-gray-900 mb-4">What's happening now:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Interview recording analyzed</p>
                <p className="text-sm text-gray-600">Your video and audio have been processed</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Responses transcribed</p>
                <p className="text-sm text-gray-600">Your answers have been converted to text</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Generating detailed feedback</p>
                <p className="text-sm text-gray-600">AI is evaluating your performance and creating personalized insights</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-400">Preparing final report</p>
                <p className="text-sm text-gray-400">Your comprehensive feedback report will be ready soon</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={onReturnToDashboard}>
            Return to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackProcessingState;