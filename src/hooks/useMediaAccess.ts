import { useState, useEffect, useRef, useCallback } from 'react';

interface MediaAccessState {
  hasVideoPermission: boolean;
  hasAudioPermission: boolean;
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  isRequestingPermissions: boolean;
  error: string | null;
  isRecording: boolean;
  recordedChunks: Blob[];
}

interface UseMediaAccessReturn extends MediaAccessState {
  requestPermissions: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => Blob | null;
  toggleVideo: () => void;
  toggleAudio: () => void;
  cleanup: () => void;
}

export const useMediaAccess = (): UseMediaAccessReturn => {
  const [state, setState] = useState<MediaAccessState>({
    hasVideoPermission: false,
    hasAudioPermission: false,
    videoStream: null,
    audioStream: null,
    isRequestingPermissions: false,
    error: null,
    isRecording: false,
    recordedChunks: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const requestPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isRequestingPermissions: true, error: null }));

    try {
      console.log('Requesting media permissions...');
      
      // Request both video and audio permissions
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

      console.log('Media permissions granted:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Separate video and audio streams
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const videoStream = videoTracks.length > 0 ? new MediaStream(videoTracks) : null;
      const audioStream = audioTracks.length > 0 ? new MediaStream(audioTracks) : null;

      setState(prev => ({
        ...prev,
        hasVideoPermission: videoTracks.length > 0,
        hasAudioPermission: audioTracks.length > 0,
        videoStream,
        audioStream,
        isRequestingPermissions: false
      }));

    } catch (error) {
      console.error('Error requesting media permissions:', error);
      
      let errorMessage = 'Failed to access camera and microphone';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera and microphone access denied. Please allow permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera and microphone access not supported in this browser.';
        }
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isRequestingPermissions: false
      }));
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!state.audioStream) {
      console.warn('No audio stream available for recording');
      return;
    }

    try {
      console.log('Starting audio recording...');
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(state.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
        setState(prev => ({ ...prev, isRecording: true }));
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          recordedChunks: [...chunksRef.current]
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start recording'
      }));
    }
  }, [state.audioStream]);

  const stopRecording = useCallback((): Blob | null => {
    if (mediaRecorderRef.current && state.isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      
      // Return the recorded audio as a blob
      if (chunksRef.current.length > 0) {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Recording completed, blob size:', audioBlob.size);
        return audioBlob;
      }
    }
    return null;
  }, [state.isRecording]);

  const toggleVideo = useCallback(() => {
    if (state.videoStream) {
      const videoTracks = state.videoStream.getVideoTracks();
      const newEnabled = !videoTracks.some(track => track.enabled);
      videoTracks.forEach(track => {
        track.enabled = newEnabled;
      });
      
      setState(prev => ({
        ...prev,
        hasVideoPermission: newEnabled
      }));
      
      console.log('Video toggled:', newEnabled ? 'ON' : 'OFF');
    }
  }, [state.videoStream]);

  const toggleAudio = useCallback(() => {
    if (state.audioStream) {
      const audioTracks = state.audioStream.getAudioTracks();
      const newEnabled = !audioTracks.some(track => track.enabled);
      audioTracks.forEach(track => {
        track.enabled = newEnabled;
      });
      
      setState(prev => ({
        ...prev,
        hasAudioPermission: newEnabled
      }));
      
      console.log('Audio toggled:', newEnabled ? 'ON' : 'OFF');
    }
  }, [state.audioStream]);

  const cleanup = useCallback(() => {
    console.log('Cleaning up media streams...');
    
    // Stop recording if active
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (state.videoStream) {
      state.videoStream.getTracks().forEach(track => track.stop());
    }
    if (state.audioStream) {
      state.audioStream.getTracks().forEach(track => track.stop());
    }

    setState({
      hasVideoPermission: false,
      hasAudioPermission: false,
      videoStream: null,
      audioStream: null,
      isRequestingPermissions: false,
      error: null,
      isRecording: false,
      recordedChunks: []
    });
  }, [state.videoStream, state.audioStream, state.isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    requestPermissions,
    startRecording,
    stopRecording,
    toggleVideo,
    toggleAudio,
    cleanup
  };
};