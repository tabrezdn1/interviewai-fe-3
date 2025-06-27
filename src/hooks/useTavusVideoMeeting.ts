import { useState, useEffect, useCallback } from 'react';
import { createConversation, endConversation, getReplicaForInterviewType } from '../lib/tavus';

interface UseTavusVideoMeetingOptions {
  interviewType: string;
  participantName: string;
  role: string;
  company?: string;
  conversationalContext?: string;
  customGreeting?: string;
  tavusPersonaId?: string;
  initialConversationUrl?: string;
  autoStart?: boolean;
}

interface UseTavusVideoMeetingReturn {
  conversationUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
}

export function useTavusVideoMeeting(options: UseTavusVideoMeetingOptions): UseTavusVideoMeetingReturn {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Initialize with the provided URL if available
  useEffect(() => {
    if (options.initialConversationUrl) {
      console.log('Using pre-generated conversation URL:', options.initialConversationUrl);
      setConversationUrl(options.initialConversationUrl);
      setIsConnected(true);
      
      // Extract conversation ID from URL if possible
      const urlParts = options.initialConversationUrl.split('/');
      const possibleId = urlParts[urlParts.length - 1];
      if (possibleId && possibleId.length > 8) {
        setConversationId(possibleId);
      }
    }
  }, [options.initialConversationUrl]);
  // Start a new Tavus conversation
  const startConversation = useCallback(async () => {
    // If we already have a conversation URL, just use it
    if (conversationUrl) {
      console.log('Using existing conversation URL:', conversationUrl);
      setIsConnected(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating Tavus conversation...');
      
      let replicaId: string | null;
      let personaId: string | null;
      
      // Determine replica and persona IDs
      const replicaInfo = getReplicaForInterviewType(options.interviewType);
      replicaId = replicaInfo.replicaId;
      
      if (!replicaId) {
        throw new Error(`No replica configured for interview type: ${options.interviewType}`);
      }

      // Prioritize using the provided Tavus Persona ID
      if (options.tavusPersonaId) {
        console.log('Using provided Tavus persona ID:', options.tavusPersonaId);
        personaId = options.tavusPersonaId;
      } 
      // If no persona ID, use the default persona for the replica
      else {
        personaId = replicaInfo.personaId;
      }

      if (!personaId) {
        throw new Error(`No persona configured for interview type: ${options.interviewType}`);
      }
      
      // Create conversation with green screen enabled
      const conversationRequest = {
        replica_id: replicaId,
        persona_id: personaId,
        conversation_name: `${options.role} Interview - ${new Date().toISOString()}`,
        properties: {
          // Apply greenscreen to the background for chroma key effect
          apply_greenscreen: false,
          max_call_duration: 3600, // 1 hour
          participant_left_timeout: 60,
          participant_absent_timeout: 300,
          enable_recording: true,
          enable_transcription: true,
          language: 'English'
        }
      };
      
      // Add conversational context and custom greeting if available
      if (options.conversationalContext) {
        console.log('Adding conversational context to request');
        conversationRequest.properties.conversational_context = options.conversationalContext;
      }
      
      if (options.customGreeting) {
        console.log('Adding custom greeting to request');
        conversationRequest.properties.custom_greeting = options.customGreeting;
      }
      
      console.log('Sending conversation request to Tavus API');
      const response = await createConversation(conversationRequest);
      
      console.log('Tavus conversation created:', response);
      setConversationId(response.conversation_id);
      setConversationUrl(response.conversation_url);
      setIsConnected(true);
      
    } catch (err) {
      console.error('Failed to create Tavus conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  }, [options.interviewType, options.role, options.company, options.conversationalContext, options.customGreeting, options.tavusPersonaId]);

  // End the current Tavus conversation
  const endConversationHandler = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      console.log('Ending Tavus conversation:', conversationId);
      
      await endConversation(conversationId);
      
      setConversationId(null);
      setConversationUrl(null);
      setIsConnected(false);
      
    } catch (err) {
      console.error('Failed to end Tavus conversation:', err);
      throw err;
    }
  }, [conversationId]);

  // Auto-start if requested
  useEffect(() => {
    if (options.autoStart && !conversationUrl && !isLoading) {
      startConversation();
    }
  }, [options.autoStart, conversationUrl, isLoading, startConversation]);

  return {
    conversationUrl,
    isLoading,
    error,
    isConnected,
    startConversation,
    endConversation: endConversationHandler
  };
}