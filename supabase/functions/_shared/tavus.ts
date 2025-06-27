// Tavus API client for Deno Edge Functions

export interface TavusConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TavusConversationRequest {
  replica_id: string;
  persona_id: string;
  conversation_name?: string;
  callback_url?: string;
  properties?: {
    max_call_duration?: number;
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
    enable_recording?: boolean;
    enable_transcription?: boolean;
    language?: string;
    apply_greenscreen?: boolean;
  };
}

export interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
  created_at: string;
  round?: string;
  events?: TavusConversationEvent[];
  conversational_context?: string;
  callback_url?: string;
  replica_id?: string;
  persona_id?: string;
  updated_at?: string;
}

export interface TavusConversationEvent {
  created_at: string;
  updated_at: string;
  event_type: string;
  message_type: string;
  properties: {
    transcript?: {
      role: string;
      content: string;
    }[];
    analysis?: string;
    replica_id?: string;
    shutdown_reason?: string;
  };
  timestamp: string;
}

export interface TavusReplicaResponse {
  replica_id: string;
  replica_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  visibility: string;
  video_url?: string;
  thumbnail_url?: string;
}

export interface TavusPersonaRequest {
  persona_name: string;
  system_prompt: string;
}

export interface TavusPersonaResponse {
  persona_id: string;
  persona_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewRound {
  id: string;
  name: string;
  description: string;
  replicaId: string;
  personaId: string;
  duration: number; // in minutes
  icon: string;
}

export class TavusAPI {
  private config: TavusConfig;

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://tavusapi.com'
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}?verbose=true`;
    
    console.log('Making Tavus API request:', {
      url,
      method: options.method || 'GET',
      hasApiKey: !!this.config.apiKey
    });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('Tavus API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavus API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(`Tavus API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    let data;
    try {
      const responseText = await response.text();
      console.log('Tavus API raw response:', responseText);
      
      if (responseText.trim() === '') {
        // Handle empty response body
        data = {};
      } else {
        data = JSON.parse(responseText);
      }
    } catch (jsonError) {
      console.error('Failed to parse Tavus API response as JSON:', jsonError);
      throw new Error(`Invalid JSON response from Tavus API: ${jsonError.message}`);
    }
    
    console.log('Tavus API success response:', data);
    return data;
  }

  // Create a new conversation
  async createConversation(
    request: TavusConversationRequest
  ): Promise<TavusConversationResponse> {
    try {
      console.log('Creating Tavus conversation with request:', request);
      
      // Validate required fields
      if (!request.callback_url) {
        // Construct default callback URL if not provided
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        request.callback_url = `${supabaseUrl}/functions/v1/tavus-callback`;
      }
      if (!request.replica_id) {
        throw new Error('replica_id is required for Tavus conversation');
      }
      if (!request.persona_id) {
        throw new Error('persona_id is required for Tavus conversation');
      }

      // Create conversation request with proper properties for Daily.co integration
      const conversationRequest = {
        replica_id: request.replica_id,
        persona_id: request.persona_id,
        conversation_name: request.conversation_name,
        callback_url: request.callback_url,
        properties: {
          max_call_duration: request.properties?.max_call_duration || 3600,
          participant_left_timeout: request.properties?.participant_left_timeout || 60,
          participant_absent_timeout: request.properties?.participant_absent_timeout || 60,
          enable_recording: request.properties?.enable_recording ?? true,
          enable_transcription: request.properties?.enable_transcription ?? true,
          language: request.properties?.language || 'English',
          apply_greenscreen: request.properties?.apply_greenscreen ?? false,
        }
      };
      
      const response = await this.makeRequest<TavusConversationResponse>('/v2/conversations', {
        method: 'POST',
        body: JSON.stringify(conversationRequest),
      });
      
      return response;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get conversation details
  async getConversation(conversationId: string, verbose: boolean = false): Promise<TavusConversationResponse> {
    try {
      const endpoint = `/v2/conversations/${conversationId}${verbose ? '?verbose=true' : ''}`;
      return await this.makeRequest<TavusConversationResponse>(endpoint);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // End a conversation
  async endConversation(conversationId: string): Promise<void> {
    try {
      await this.makeRequest(`/v2/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }

  // Create a new persona
  async createPersona(request: TavusPersonaRequest): Promise<TavusPersonaResponse> {
    try {
      console.log('Creating Tavus persona with request:', request);
      
      // Validate required fields
      if (!request.persona_name) {
        throw new Error('persona_name is required for Tavus persona');
      }
      if (!request.system_prompt) {
        throw new Error('system_prompt is required for Tavus persona');
      }
      
      const response = await this.makeRequest<TavusPersonaResponse>('/v2/personas', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      
      return response;
    } catch (error) {
      console.error('Error creating persona:', error);
      throw error;
    }
  }

  // Get persona details
  async getPersona(personaId: string): Promise<TavusPersonaResponse> {
    try {
      return await this.makeRequest<TavusPersonaResponse>(`/v2/personas/${personaId}`);
    } catch (error) {
      console.error('Error fetching persona:', error);
      throw error;
    }
  }

  // Delete a persona
  async deletePersona(personaId: string): Promise<void> {
    try {
      await this.makeRequest(`/v2/personas/${personaId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting persona:', error);
      throw error;
    }
  }
}

// Get Tavus API instance
export function getTavusAPI(): TavusAPI {
  const apiKey = Deno.env.get('TAVUS_API_KEY');
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }
  return new TavusAPI(apiKey);
}

// Get replica and persona IDs for specific interview type
export function getReplicaForInterviewType(interviewType: string): { replicaId: string | null; personaId: string | null } {
  // Get environment variables for replicas
  const hrReplicaId = Deno.env.get('TAVUS_HR_REPLICA_ID');
  const technicalReplicaId = Deno.env.get('TAVUS_TECHNICAL_REPLICA_ID');
  const behavioralReplicaId = Deno.env.get('TAVUS_BEHAVIORAL_REPLICA_ID');
  
  // Map interview types to replicas
  const typeToReplicaMap: Record<string, string | null> = {
    'screening': hrReplicaId || null,
    'technical': technicalReplicaId || null,
    'behavioral': behavioralReplicaId || null,
    'mixed': technicalReplicaId || null, // Default to technical for mixed interviews
    'phone': hrReplicaId || null // Map phone to screening
  };
  
  // Get environment variables for personas
  const hrPersonaId = Deno.env.get('TAVUS_HR_PERSONA_ID');
  const technicalPersonaId = Deno.env.get('TAVUS_TECHNICAL_PERSONA_ID');
  const behavioralPersonaId = Deno.env.get('TAVUS_BEHAVIORAL_PERSONA_ID');
  
  // Map interview types to personas
  const typeToPersonaMap: Record<string, string | null> = {
    'screening': hrPersonaId || null,
    'technical': technicalPersonaId || null,
    'behavioral': behavioralPersonaId || null,
    'mixed': technicalPersonaId || null, // Default to technical for mixed interviews
    'phone': hrPersonaId || null // Map phone to screening
  };
  
  // Return the appropriate replica and persona IDs
  return {
    replicaId: typeToReplicaMap[interviewType] || null,
    personaId: typeToPersonaMap[interviewType] || null
  };
}