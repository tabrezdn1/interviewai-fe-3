// Tavus API integration for AI video interviews
import { supabase } from './supabase';
import type { InterviewRound } from '../../supabase/functions/_shared/tavus';

// Interview round configurations
export const getInterviewRounds = (): InterviewRound[] => {
  const hrReplicaId = import.meta.env.VITE_TAVUS_HR_REPLICA_ID;
  const hrPersonaId = import.meta.env.VITE_TAVUS_HR_PERSONA_ID;
  const technicalReplicaId = import.meta.env.VITE_TAVUS_TECHNICAL_REPLICA_ID;
  const technicalPersonaId = import.meta.env.VITE_TAVUS_TECHNICAL_PERSONA_ID;
  const behavioralReplicaId = import.meta.env.VITE_TAVUS_BEHAVIORAL_REPLICA_ID;
  const behavioralPersonaId = import.meta.env.VITE_TAVUS_BEHAVIORAL_PERSONA_ID;

  const rounds: InterviewRound[] = [];

  if (hrReplicaId && hrReplicaId !== 'your_hr_replica_id_here' && 
      hrPersonaId && hrPersonaId !== 'your_hr_persona_id_here') {
    rounds.push({
      id: 'screening',
      name: 'HR Screening',
      description: 'Initial screening with HR representative',
      replicaId: hrReplicaId,
      personaId: hrPersonaId,
      duration: 15,
      icon: 'User'
    });
  }

  if (technicalReplicaId && technicalReplicaId !== 'your_technical_replica_id_here' &&
      technicalPersonaId && technicalPersonaId !== 'your_technical_persona_id_here') {
    rounds.push({
      id: 'technical',
      name: 'Technical Round',
      description: 'Technical interview with engineering lead',
      replicaId: technicalReplicaId,
      personaId: technicalPersonaId,
      duration: 45,
      icon: 'Code'
    });
  }

  if (behavioralReplicaId && behavioralReplicaId !== 'your_behavioral_replica_id_here' &&
      behavioralPersonaId && behavioralPersonaId !== 'your_behavioral_persona_id_here') {
    rounds.push({
      id: 'behavioral',
      name: 'Behavioral Round',
      description: 'Behavioral interview with hiring manager',
      replicaId: behavioralReplicaId,
      personaId: behavioralPersonaId,
      duration: 30,
      icon: 'MessageSquare'
    });
  }

  return rounds;
};

// Get replica and persona IDs for specific interview type
export const getReplicaForInterviewType = (interviewType: string): { replicaId: string | null; personaId: string | null } => {
  const rounds = getInterviewRounds();
  console.log('Getting replica for interview type:', interviewType, 'Available rounds:', rounds);
  
  // Map interview types to rounds
  const typeToRoundMap: Record<string, string> = {
    'screening': 'screening',
    'technical': 'technical',
    'behavioral': 'behavioral',
    'mixed': 'technical', // Default to technical for mixed interviews
    'phone': 'screening' // Map phone to screening
  };

  // Default to technical if the interview type isn't recognized
  const roundId = typeToRoundMap[interviewType] || 'technical';
  const round = rounds.find(r => r.id === roundId);
  console.log('Selected round:', round);
  
  if (round) {
    return {
      replicaId: round.replicaId,
      personaId: round.personaId
    };
  }
  
  // If no matching round found, try to use any available round
  if (rounds.length > 0) {
    console.log('No matching round found, using first available round:', rounds[0]);
    return {
      replicaId: rounds[0].replicaId,
      personaId: rounds[0].personaId
    };
  }
  
  // If no rounds available, return null values
  console.warn('No rounds available for interview type:', interviewType);
  return {
    replicaId: null,
    personaId: null
  };
};

// Helper function to check if Tavus is properly configured
export const isTavusConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
  const hasValidApiKey = !!(apiKey && apiKey !== 'your_tavus_api_key_here');
  
  // Check if at least one complete round is configured (replica + persona)
  const rounds = getInterviewRounds();
  const hasValidRounds = rounds.length > 0;
  
  console.log('Tavus configuration check:', {
    hasApiKey: !!apiKey,
    isValidApiKey: hasValidApiKey,
    apiKeyLength: apiKey?.length || 0,
    availableRounds: rounds.length,
    hasValidRounds
  });
  
  return hasValidApiKey && hasValidRounds;
};

// Debug function to check environment variables
export const debugTavusConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_TAVUS_API_KEY,
    hrReplicaId: import.meta.env.VITE_TAVUS_HR_REPLICA_ID,
    hrPersonaId: import.meta.env.VITE_TAVUS_HR_PERSONA_ID,
    technicalReplicaId: import.meta.env.VITE_TAVUS_TECHNICAL_REPLICA_ID,
    technicalPersonaId: import.meta.env.VITE_TAVUS_TECHNICAL_PERSONA_ID,
    behavioralReplicaId: import.meta.env.VITE_TAVUS_BEHAVIORAL_REPLICA_ID,
    behavioralPersonaId: import.meta.env.VITE_TAVUS_BEHAVIORAL_PERSONA_ID
  };
  
  console.log('Tavus Environment Variables:', {
    hasApiKey: !!config.apiKey,
    apiKeyPreview: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'Not set',
    hasHrReplica: !!config.hrReplicaId,
    hasHrPersona: !!config.hrPersonaId,
    hasTechnicalReplica: !!config.technicalReplicaId,
    hasTechnicalPersona: !!config.technicalPersonaId,
    hasBehavioralReplica: !!config.behavioralReplicaId,
    hasBehavioralPersona: !!config.behavioralPersonaId,
    availableRounds: getInterviewRounds().length
  });
  
  return config;
};

// Function to create a conversation via Supabase RPC
export const createConversation = async (
  request: any
): Promise<TavusConversationResponse> => {
  console.log('Creating Tavus conversation via Supabase RPC');
  
  try {
    const { data, error } = await supabase.rpc('create_tavus_conversation', {
      conversation_request: request
    });

    if (error) {
      console.error('Failed to create conversation via RPC:', error);
      throw new Error(error.message || 'Failed to create conversation');
    }

    return data;
  } catch (error) {
    console.error('Error in createConversation:', error);
    throw error;
  }
};

// Function to end a conversation via Supabase RPC
export const endConversation = async (conversationId: string): Promise<void> => {
  console.log('Ending Tavus conversation via Supabase RPC:', conversationId);
  
  const { error } = await supabase.rpc('end_tavus_conversation', {
    conversation_id: conversationId
  });

  if (error) {
    console.error('Failed to end conversation via RPC:', error);
    throw error;
  }
};

// Function to delete a persona via Supabase RPC
export const deletePersona = async (personaId: string): Promise<void> => {
  console.log('Deleting Tavus persona via Supabase RPC:', personaId);
  
  const { error } = await supabase.rpc('delete_tavus_persona', {
    persona_id: personaId
  });

  if (error) {
    console.error('Failed to delete persona via RPC:', error);
    throw error;
  }
};

export type { InterviewRound };