import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { Button } from '../ui/button';

interface BackButtonProps {
  customPath?: string;
  customLabel?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  customPath, 
  customLabel, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (customPath) {
      navigate(customPath);
    } else {
      // Default back navigation logic based on current path
      const path = location.pathname;
      
      if (path.startsWith('/interview/')) {
        navigate('/dashboard');
      } else if (path.startsWith('/feedback/')) {
        navigate('/dashboard');
      } else if (path === '/setup') {
        navigate('/dashboard');
      } else if (path === '/settings') {
        navigate('/dashboard');
      } else if (path === '/billing') {
        navigate('/dashboard');
      } else if (path === '/pricing') {
        navigate('/');
      } else {
        // Fallback to dashboard or home
        navigate('/dashboard');
      }
    }
  };

  const getBackLabel = () => {
    if (customLabel) return customLabel;
    
    const path = location.pathname;
    
    if (path.startsWith('/interview/') || path.startsWith('/feedback/') || path === '/setup') {
      return 'Back to Dashboard';
    } else if (path === '/settings' || path === '/billing') {
      return 'Back to Dashboard';
    } else if (path === '/pricing') {
      return 'Back to Home';
    } else {
      return 'Back';
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      size="sm"
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 ${className}`}
    >
      <ChevronLeft className="h-4 w-4" />
      {getBackLabel()}
    </Button>
  );
};

export default BackButton;