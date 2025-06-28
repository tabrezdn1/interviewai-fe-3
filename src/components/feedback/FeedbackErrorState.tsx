import React from 'react';
import { XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface FeedbackErrorStateProps {
  errorMessage?: string;
  onRetry: () => void;
}

const FeedbackErrorState: React.FC<FeedbackErrorStateProps> = ({
  errorMessage = "We encountered an issue while generating your feedback. Our team has been notified.",
  onRetry
}) => {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-semibold mb-3">Feedback Generation Failed</h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {errorMessage}
          </p>
          
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-left max-w-md mx-auto">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">
                  This could be due to technical issues or problems with the interview recording. You can try again or contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackErrorState;