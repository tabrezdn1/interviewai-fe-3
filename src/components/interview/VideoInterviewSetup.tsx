import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, Mic, Monitor, AlertCircle, CheckCircle, 
  Settings, Wifi, Camera, Volume2, Play, Loader2 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { getConversationMinutes } from '../../lib/utils';
import { useTavusVideoMeeting } from '../../hooks/useTavusVideoMeeting';

interface VideoInterviewSetupProps {
  interviewType: string;
  participantName: string;
  role: string;
  company?: string;
  duration?: number;
  llmGeneratedContext?: string;
  llmGeneratedGreeting?: string;
  tavusPersonaId?: string;
  initialConversationUrl?: string;
  llmGeneratedContext?: string;
  llmGeneratedGreeting?: string;
  tavusPersonaId?: string;
  onSetupComplete: (conversationUrl: string) => void;
  onError: (error: string) => void;
}

const VideoInterviewSetup: React.FC<VideoInterviewSetupProps> = ({
  interviewType,
  participantName,
  role,
  company,
  duration = 20,
  llmGeneratedContext,
  llmGeneratedGreeting,
  tavusPersonaId,
  initialConversationUrl,
  onSetupComplete,
  onError
}) => {
  const [setupStep, setSetupStep] = useState<'permissions' | 'connection' | 'ready'>('permissions');
  const [permissionStatus, setPermissionStatus] = useState<{
    camera: boolean;
    microphone: boolean;
    error?: string;
  }>({ camera: false, microphone: false });
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();
  const [conversationMinutes, setConversationMinutes] = useState<{total: number, used: number, remaining: number} | null>(null);

  // Use the Tavus video meeting hook
  const {
    conversationUrl,
    isLoading,
    error,
    startConversation,
  } = useTavusVideoMeeting({
    interviewType,
    participantName,
    role, 
    company,
    conversationalContext: llmGeneratedContext,
    customGreeting: llmGeneratedGreeting,
    tavusPersonaId: tavusPersonaId,
    initialConversationUrl: initialConversationUrl
  });

  // Load user's conversation minutes
  useEffect(() => {
    const loadMinutes = async () => {
      if (user) {
        try {
          const minutes = await getConversationMinutes(user.id);
          setConversationMinutes(minutes);
        } catch (error) {
          console.error('Error loading conversation minutes:', error);
        }
      }
    };
    
    loadMinutes();
  }, [user]);

  // Check permissions on mount
  useEffect(() => {
    checkDevicePermissions();
  }, []);

  // Handle conversation URL change
  useEffect(() => {
    if (conversationUrl) {
      console.log('Conversation URL available, completing setup:', conversationUrl);
      onSetupComplete(conversationUrl);
    }
  }, [conversationUrl, onSetupComplete]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const checkDevicePermissions = async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Stop the stream immediately after checking
      stream.getTracks().forEach(track => track.stop());
      
      const permissions = { camera: true, microphone: true };
      setPermissionStatus(permissions);
      
      if (permissions.camera || permissions.microphone) {
        setSetupStep('connection');
        await testConnectionQuality();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      
      let errorMessage = 'Failed to access camera and microphone';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera and microphone access denied. Please allow permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera and microphone not supported in this browser.';
        }
      }
      
      setPermissionStatus({ 
        camera: false, 
        microphone: false, 
        error: errorMessage 
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testConnectionQuality = async () => {
    try {
      const startTime = Date.now();
      
      // Simple ping test to estimate latency
      await fetch(window.location.origin, { method: 'HEAD' });
      
      const latency = Date.now() - startTime;
      
      let quality: 'poor' | 'fair' | 'good' | 'excellent' = 'excellent';
      if (latency > 200) quality = 'good';
      if (latency > 500) quality = 'fair';
      if (latency > 1000) quality = 'poor';
      
      setConnectionQuality(quality);
      setSetupStep('ready');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionQuality('poor');
      setSetupStep('ready');
    }
  };

  const handleStartInterview = async () => {
    try {
      console.log('Starting interview with type:', interviewType);
      await startConversation();
    } catch (error) {
      console.error('Failed to start interview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start video call';
      onError(errorMessage);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityBadgeVariant = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'warning';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Video Interview Setup</h2>
        <p className="text-gray-600">
          Let's prepare your AI video interview for the {role} position
          {company && ` at ${company}`}
        </p>
      </div>

      {/* Setup Steps */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className={`text-center p-4 rounded-lg border ${
          setupStep === 'permissions' ? 'border-primary bg-primary/5' : 
          permissionStatus.camera || permissionStatus.microphone ? 'border-green-200 bg-green-50' : 
          'border-gray-200'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
            permissionStatus.camera || permissionStatus.microphone ? 'bg-green-100 text-green-600' :
            setupStep === 'permissions' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {permissionStatus.camera || permissionStatus.microphone ? <CheckCircle className="h-4 w-4" /> : '1'}
          </div>
          <p className="text-sm font-medium">Permissions</p>
        </div>

        <div className={`text-center p-4 rounded-lg border ${
          setupStep === 'connection' ? 'border-primary bg-primary/5' : 
          setupStep === 'ready' ? 'border-green-200 bg-green-50' : 
          'border-gray-200'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
            setupStep === 'ready' ? 'bg-green-100 text-green-600' :
            setupStep === 'connection' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {setupStep === 'ready' ? <CheckCircle className="h-4 w-4" /> : '2'}
          </div>
          <p className="text-sm font-medium">Connection</p>
        </div>

        <div className={`text-center p-4 rounded-lg border ${
          conversationUrl ? 'border-green-200 bg-green-50' : 
          setupStep === 'ready' ? 'border-primary bg-primary/5' : 
          'border-gray-200'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
            conversationUrl ? 'bg-green-100 text-green-600' :
            setupStep === 'ready' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {conversationUrl ? <CheckCircle className="h-4 w-4" /> : '3'}
          </div>
          <p className="text-sm font-medium">Ready</p>
        </div>
      </div>

      {/* Permissions Check */}
      {setupStep === 'permissions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Device Permissions
              </CardTitle>
              <CardDescription>
                We need access to your camera and microphone for the video interview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  permissionStatus.camera ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Video className={`h-5 w-5 ${
                      permissionStatus.camera ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium">Camera</p>
                      <p className="text-sm text-gray-600">
                        {permissionStatus.camera ? 'Granted' : 'Required'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  permissionStatus.microphone ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Mic className={`h-5 w-5 ${
                      permissionStatus.microphone ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium">Microphone</p>
                      <p className="text-sm text-gray-600">
                        {permissionStatus.microphone ? 'Granted' : 'Required'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {permissionStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{permissionStatus.error}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={checkDevicePermissions} 
                disabled={isChecking}
                variant="interview"
                className="w-full" 
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking Permissions...
                  </>
                ) : (
                  'Grant Permissions'
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Connection Test */}
      {setupStep === 'connection' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Connection Test
              </CardTitle>
              <CardDescription>
                Testing your internet connection quality for the best interview experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center text-gray-600">
                Testing connection quality...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Ready to Start */}
      {setupStep === 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Ready to Start
              </CardTitle>
              <CardDescription>
                Everything looks good! You're ready to begin your AI video interview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Status */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Video className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Camera</p>
                  <p className="text-xs text-green-600">Ready</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Mic className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Microphone</p>
                  <p className="text-xs text-green-600">Ready</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Wifi className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Connection</p>
                  <Badge variant={getQualityBadgeVariant(connectionQuality)} className="text-xs">
                    {connectionQuality}
                  </Badge>
                </div>
              </div>

              {/* Interview Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Interview Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Position:</span> {role}</p>
                  {company && <p><span className="font-medium">Company:</span> {company}</p>}
                  <p><span className="font-medium">Type:</span> {interviewType} Interview</p>
                  <p><span className="font-medium">Participant:</span> {participantName}</p>
                </div>
              </div>

              {/* Connection Quality Warning */}
              {connectionQuality === 'poor' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Poor Connection Quality</p>
                      <p className="text-xs text-yellow-700">
                        Your connection may affect video quality. Consider moving closer to your router.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4">
                <Button 
                  onClick={handleStartInterview}
                  disabled={isLoading || !!initialConversationUrl}
                  variant="interview"
                  className="w-full text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Interview...
                    </>
                  ) : initialConversationUrl ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Joining Interview...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Interview
                    </>
                  )}
                </Button>
                
                {conversationMinutes ? (
                  <p className="text-xs text-center mt-2 text-gray-500">
                    This interview will use approximately {duration} minutes of your remaining {conversationMinutes.remaining} minutes.
                  </p>
                ) : (
                  <p className="text-xs text-center mt-2 text-gray-500">
                    Loading conversation minutes...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default VideoInterviewSetup;