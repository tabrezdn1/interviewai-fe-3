// Tavus API types

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

export interface TavusPersonaResponse {
  persona_id: string;
  persona_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TavusFeedbackRequest {
  conversation_id: string;
  interview_type: string;
  role: string;
  company?: string;
  experience_level?: string;
  difficulty_level?: string;
}

export interface TavusFeedbackResponse {
  feedback_id: string;
  status: string;
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  skill_assessment: {
    technical: {
      score: number;
      feedback: string;
    };
    communication: {
      score: number;
      feedback: string;
    };
    problem_solving: {
      score: number;
      feedback: string;
    };
    experience: {
      score: number;
      feedback: string;
    };
  };
  question_responses: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
}

export interface TavusCallbackPayload {
  conversation_id: string;
  event_type: 'conversation.completed' | 'conversation.failed' | 'conversation.started';
  data?: {
    overall_score?: number;
    summary?: string;
    strengths?: string[];
    improvements?: string[];
    skill_assessment?: {
      technical?: {
        score?: number;
        feedback?: string;
      };
      communication?: {
        score?: number;
        feedback?: string;
      };
      problem_solving?: {
        score?: number;
        feedback?: string;
      };
      experience?: {
        score?: number;
        feedback?: string;
      };
    };
    question_responses?: {
      question: string;
      answer: string;
      score: number;
      feedback: string;
    }[];
  };
  error?: {
    code: string;
    message: string;
  };
}