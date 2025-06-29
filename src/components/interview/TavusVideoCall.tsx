import React, { useState, useEffect } from 'react';
import {
  useDaily,
  DailyVideo,
  useParticipantIds,
  useLocalSessionId,
  useAudioTrack,
  useVideoTrack,
  DailyAudio,
} from '@daily-co/daily-react';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Settings, 
  Wifi, WifiOff, AlertCircle, Loader2, Monitor, Users, Clock,
  Volume2, VolumeX, Maximize, Minimize
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

/**
 * AI Interviewer Video Component - displays the remote participant (AI interviewer)
 */
const AIInterviewerVideo: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <DailyVideo
        sessionId={id}
        type="video"
        className="w-full h-full object-cover"
        style={{
          filter: 'none',
          background: 'none',
          objectFit: 'cover'
        }}
        fit="cover"
        mirror={false}
      />
      
      {/* AI Interviewer Label */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-white">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Interview AI</span>
          <Badge variant="outline" className="text-xs border-green-400 text-green-400">
            Live
          </Badge>
        </div>
      </div>
    </div>
  );
};

/**
 * Main video call component
 */
interface TavusVideoCallProps {
  conversationUrl: string;
  participantName: string;
  onLeave: () => void;
  onConnected?: () => void;
  timeRemaining?: number;
  totalDuration?: number;
  className?: string;
}

const TavusVideoCall: React.FC<TavusVideoCallProps> = ({ 
  conversationUrl, 
  participantName, 
  onLeave, 
  onConnected,
  timeRemaining,
  totalDuration,
  className = '' 
}) => {
  const remoteParticipantIds = useParticipantIds({ filter: "remote" });
  const localParticipantId = useLocalSessionId();
  const localAudio = useAudioTrack(localParticipantId);
  const localVideo = useVideoTrack(localParticipantId);
  const daily = useDaily();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [mediaPermissionsGranted, setMediaPermissionsGranted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentVideoQuality, setCurrentVideoQuality] = useState('HD');
  const [isLeavingCall, setIsLeavingCall] = useState(false);
  
  const isMicEnabled = !localAudio.isOff;
  const isVideoEnabled = !localVideo.isOff;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Auto-end call when time runs out
  useEffect(() => {
    if (timeRemaining !== undefined && timeRemaining <= 0 && isCallActive && !isLeavingCall) {
      console.log('Time limit reached, ending call automatically');
      handleLeave();
    }
  }, [timeRemaining, isCallActive, isLeavingCall]);

  // Request media permissions first
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log('Requesting media permissions...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        console.log('Media permissions granted');
        setMediaPermissionsGranted(true);
        
        // Stop the test stream since Daily will handle the actual streams
        stream.getTracks().forEach(track => track.stop());
        
      } catch (mediaError) {
        console.error('Media permission failed:', mediaError);
        let errorMessage = 'Failed to access camera and microphone';
        if (mediaError instanceof Error) {
          if (mediaError.name === 'NotAllowedError') {
            errorMessage = 'Camera and microphone access denied. Please allow permissions and refresh the page.';
          } else if (mediaError.name === 'NotFoundError') {
            errorMessage = 'No camera or microphone found. Please check your devices.';
          }
        }
        setConnectionError(errorMessage);
        setIsConnecting(false);
      }
    };

    initializeMedia();
  }, []);

  // Join the call when component mounts and daily instance is available
  useEffect(() => {
    if (daily && conversationUrl && mediaPermissionsGranted && !isCallActive && !isLeavingCall) {
      const joinCall = async () => {
        try {
          console.log('Joining Daily.co call:', conversationUrl);
          
          // Check if already in a call
          const meetingState = daily.meetingState();
          if (meetingState === 'joined-meeting') {
            console.log('Already joined, skipping join');
            setIsCallActive(true);
            setIsConnecting(false);
            onConnected?.();
            return;
          }
          
          await daily.join({ 
            url: conversationUrl,
            userName: participantName
          });

          console.log('Successfully joined call');
          setIsCallActive(true);

          // Ensure video and audio are enabled after joining
          await daily.setLocalVideo(true);
          await daily.setLocalAudio(true);

          // Set initial states to true since we requested media
          setLocalVideoEnabled(true);
          setLocalAudioEnabled(true);

          // Small delay to ensure Daily has properly set up the streams
          setTimeout(() => {
            setIsConnecting(false);
            onConnected?.();
            console.log('Call connection complete');
          }, 3000);
          
        } catch (err) {
          console.error('Failed to join Daily.co call:', err);
          setConnectionError('Failed to join video call');
          setIsConnecting(false);
        }
      };

      joinCall();
    }
  }, [daily, conversationUrl, participantName, onConnected, mediaPermissionsGranted, isCallActive, isLeavingCall]);

  // Separate cleanup effect
  useEffect(() => {
    return () => {
      if (daily && isCallActive) {
        console.log('Component unmounting, leaving Daily.co call gracefully');
        setIsLeavingCall(true);
        daily.leave().catch((err) => {
          console.error('Error leaving Daily.co call during cleanup:', err);
        });
      }
    };
  }, [daily, isCallActive]);

  const toggleMicrophone = async () => {
    if (daily && isCallActive && !isLeavingCall) {
      try {
        const newState = !isMicEnabled;
        await daily.setLocalAudio(newState);
        setLocalAudioEnabled(newState);
        console.log('Microphone toggled:', newState ? 'ON' : 'OFF');
      } catch (err) {
        console.error('Failed to toggle microphone:', err);
      }
    }
  };

  const toggleVideo = async () => {
    if (daily && isCallActive && !isLeavingCall) {
      try {
        const newState = !isVideoEnabled;
        await daily.setLocalVideo(newState);
        setLocalVideoEnabled(newState);
        console.log('Video toggled:', newState ? 'ON' : 'OFF');
      } catch (err) {
        console.error('Failed to toggle video:', err);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  };

  const handleLeave = async () => {
    // Just trigger the confirmation dialog - don't leave the call yet
    onLeave();
  };

  // Show loading state while connecting
  if (isConnecting && !connectionError) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-xl ${className}`}>
        <div className="text-center text-white p-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connecting to AI Interviewer</h3>
          <p className="text-gray-400">
            {!mediaPermissionsGranted 
              ? 'Requesting camera and microphone access...' 
              : 'Establishing video connection...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (connectionError) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 rounded-xl ${className}`}>
        <div className="text-center text-white p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-gray-300 text-sm mb-4">{connectionError}</p>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-gray-900"
            >
              Refresh Page
            </Button>
            <Button 
              onClick={handleLeave}
              variant="destructive"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show leaving state
  if (isLeavingCall) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-xl ${className}`}>
        <div className="text-center text-white p-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ending Interview</h3>
          <p className="text-gray-400">Disconnecting from video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {/* Main video area */}
      <div className="relative w-full h-full min-h-[500px]">
        {remoteParticipantIds.length > 0 ? (
          <AIInterviewerVideo id={remoteParticipantIds[0]} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-800">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Waiting for AI Interviewer</h3>
              <p className="text-gray-400">The AI interviewer will join shortly...</p>
            </div>
          </div>
        )}
        
        {/* Local video feed */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          {localParticipantId && isCallActive && (
            <DailyVideo
              sessionId={localParticipantId}
              type="video"
              mirror={true}
              className="w-full h-full object-cover"
              style={{
                objectFit: 'cover'
              }}
            />
          )}
          
          {/* Local video label */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs">
            You
          </div>
          
          {/* Media status indicators */}
          <div className="absolute top-2 right-2 flex gap-1">
            <div className={`w-2 h-2 rounded-full ${localVideoEnabled && isVideoEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
            <div className={`w-2 h-2 rounded-full ${localAudioEnabled && isMicEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>

          {/* Video disabled overlay */}
          {(!localVideoEnabled || !isVideoEnabled || !isCallActive) && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Connection status */}
        <div className="absolute top-4 left-4 flex items-center gap-3 bg-black bg-opacity-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className={`text-sm font-medium ${isCallActive ? 'text-green-400' : 'text-yellow-400'}`}>
              {isCallActive ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          {timeRemaining !== undefined && totalDuration !== undefined && (
            <div className="flex items-center gap-2 border-l border-white/20 pl-3">
              <Clock className="h-4 w-4 text-white" />
              <span className={`text-sm font-medium ${timeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeRemaining)} <span className="text-xs text-gray-400">/ {formatTime(totalDuration)}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm border-t border-gray-700 p-4">
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleVideo}
              variant="ghost"
              size="sm"
              disabled={!isCallActive || isLeavingCall}
              className={`p-3 rounded-full transition-colors ${
                localVideoEnabled && isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${(!isCallActive || isLeavingCall) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {localVideoEnabled && isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={toggleMicrophone}
              variant="ghost"
              size="sm"
              disabled={!isCallActive || isLeavingCall}
              className={`p-3 rounded-full transition-colors ${
                localAudioEnabled && isMicEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${(!isCallActive || isLeavingCall) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {localAudioEnabled && isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              disabled={isLeavingCall}
              className={`p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors ${isLeavingCall ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Center - Interview status */}
          <div className="text-white text-sm font-medium">
            AI Interview Session
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              disabled={isLeavingCall}
              className={`p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors ${isLeavingCall ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              size="sm"
              disabled={isLeavingCall}
              className={`p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors ${isLeavingCall ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={handleLeave}
              variant="destructive"
              size="sm"
              disabled={isLeavingCall}
              className={`p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors ${isLeavingCall ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Daily Audio component for audio handling */}
      <DailyAudio />
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Settings</DialogTitle>
            <DialogDescription>
              Adjust your video and audio settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Media Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Camera</span>
                  <Badge variant={localVideoEnabled && isVideoEnabled ? "default" : "destructive"}>
                    {localVideoEnabled && isVideoEnabled ? 'On' : 'Off'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Microphone</span>
                  <Badge variant={localAudioEnabled && isMicEnabled ? "default" : "destructive"}>
                    {localAudioEnabled && isMicEnabled ? 'On' : 'Off'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Call Status</span>
                  <Badge variant={isCallActive ? "default" : "destructive"}>
                    {isCallActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowSettings(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TavusVideoCall;