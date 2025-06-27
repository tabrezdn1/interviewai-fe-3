import { useState, useEffect, useCallback } from 'react';
import { createConversation, endConversation, getReplicaForInterviewType, isTavusConfigured } from '../lib/tavus';

interface TavusConversation {
  conversation_id: string;
  conversation_url: string;
  status: string;
  created_at: string;
}

interface UseTavusConversationOptions {
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

interface UseTavusConversationReturn {
  conversation: TavusConversation | null;
  isLoading: boolean;
  error: string | null;
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
}

export const useTavusConversation = (options: UseTavusConversationOptions): UseTavusConversationReturn => {
  const [conversation, setConversation] = useState<TavusConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with pre-generated conversation URL if available
  useEffect(() => {
    if (options.initialConversationUrl && !conversation) {
      console.log('Using pre-generated conversation URL:', options.initialConversationUrl);
      
      // Extract conversation ID from URL if possible
      const urlParts = options.initialConversationUrl.split('/');
      const possibleId = urlParts[urlParts.length - 1];
      
      // Create a conversation object from the URL
      const conversationObj = {
        conversation_id: possibleId || `pre-generated-${Date.now()}`,
        conversation_url: options.initialConversationUrl,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      setConversation(conversationObj);
    }
  }, [options.initialConversationUrl, conversation]);
  // Check if Tavus is configured on mount
  useEffect(() => {
    const isConfigured = isTavusConfigured();
    console.log('Tavus configuration status:', isConfigured);
  }, []);

  // Start a new Tavus conversation
  const startConversation = useCallback(async () => {
    // If we already have a conversation (from pre-generated URL), just use it
    if (conversation) {
      console.log('Using existing conversation:', conversation);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {

      console.log('Creating Tavus conversation for:', options.interviewType);

      // Prepare the conversation request
      let conversationRequest: TavusConversationRequest;
      
      // If we have a persona ID, use it directly
      if (options.tavusPersonaId) {
        console.log('Using provided Tavus persona ID:', options.tavusPersonaId);
        
        // Get the appropriate replica for this interview type
        const { replicaId } = getReplicaForInterviewType(options.interviewType);
        
        if (!replicaId) {
          throw new Error(`No replica configured for interview type: ${options.interviewType}`);
        }
        
        conversationRequest = {
          replica_id: replicaId,
          persona_id: options.tavusPersonaId,
          conversation_name: `${options.role} Interview - ${new Date().toISOString()}`,
          properties: {
            max_call_duration: 3600,
            enable_recording: true,
            enable_transcription: true,
            apply_greenscreen: true
          }
        };
      } 
      // If we have context and greeting, use them with default persona
      else if (options.conversationalContext || options.customGreeting) {
        console.log('Using provided context and greeting for conversation');
        
        // Get the appropriate replica and persona for this interview type
        const { replicaId, personaId } = getReplicaForInterviewType(options.interviewType);
        
        if (!replicaId || !personaId) {
          throw new Error(`No replica or persona configured for interview type: ${options.interviewType}`);
        }
        
        conversationRequest = {
          replica_id: replicaId,
          persona_id: personaId,
          conversation_name: `${options.role} Interview - ${new Date().toISOString()}`,
          properties: {
            max_call_duration: 3600,
            enable_recording: true,
            enable_transcription: true,
            apply_greenscreen: true
          }
        };
        
        // Add conversational context and custom greeting if available
        if (options.conversationalContext) {
          conversationRequest.properties!.conversational_context = options.conversationalContext;
        }
        
        if (options.customGreeting) {
          conversationRequest.properties!.custom_greeting = options.customGreeting;
        }
      }
      // Otherwise, use the default persona for this interview type
      else {
        console.log('Using default persona for interview type:', options.interviewType);
        
        // Get the appropriate replica and persona for this interview type
        const { replicaId, personaId } = getReplicaForInterviewType(options.interviewType);
        
        if (!replicaId || !personaId) {
          throw new Error(`No replica or persona configured for interview type: ${options.interviewType}`);
        }
        
        conversationRequest = {
          replica_id: replicaId,
          persona_id: personaId,
          conversation_name: `${options.role} Interview - ${new Date().toISOString()}`,
          properties: {
            max_call_duration: 3600,
            enable_recording: true,
            enable_transcription: true,
            apply_greenscreen: true
          }
        };
      }
      
      // Create the conversation
      const newConversation = await createConversation(conversationRequest);
      
      setConversation(newConversation);
      console.log('Conversation created:', newConversation);
      
    } catch (err) {
      console.error('Failed to create Tavus conversation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.interviewType, options.role, options.company, options.conversationalContext, options.customGreeting, options.tavusPersonaId]);

  // End the Tavus conversation
  const endConversationCallback = useCallback(async () => {
    if (!conversation) return;

    try {
      console.log('Ending Tavus conversation:', conversation.conversation_id);
      await endConversation(conversation.conversation_id);

      setConversation(null);
      console.log('Conversation ended');
      
    } catch (err) {
      console.error('Failed to end conversation:', err);
      throw err;
    }
  }, [conversation]);

  // Auto-start if requested
  useEffect(() => {
    if (options.autoStart && !conversation && !isLoading) {
      // If we have a pre-generated URL, don't start a new conversation
      if (options.initialConversationUrl) {
        return;
      }
      startConversation();
    }
  }, [options.autoStart, conversation, isLoading, startConversation, options.initialConversationUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if we have a conversation and it's not already being cleaned up
      if (conversation) {
        console.log('Cleaning up conversation on unmount:', conversation.conversation_id);
        endConversation(conversation.conversation_id).catch(console.error);
      }
    };
  }, [conversation]);

  return {
    conversation,
    isLoading,
    error,
    startConversation,
    endConversation: endConversationCallback,
  };
};