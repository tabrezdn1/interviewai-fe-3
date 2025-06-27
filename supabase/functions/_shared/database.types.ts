export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      difficulty_levels: {
        Row: {
          created_at: string
          id: number
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          label: string
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          label?: string
          value?: string
        }
        Relationships: []
      }
      experience_levels: {
        Row: {
          created_at: string
          id: number
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          label: string
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          label?: string
          value?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          communication_feedback: string | null
          communication_score: number | null
          created_at: string
          experience_feedback: string | null
          experience_score: number | null
          id: number
          improvements: string[] | null
          interview_id: string
          overall_score: number
          problem_solving_feedback: string | null
          problem_solving_score: number | null
          strengths: string[] | null
          summary: string
          tavus_conversation_id: string | null
          technical_feedback: string | null
          technical_score: number | null
        }
        Insert: {
          communication_feedback?: string | null
          communication_score?: number | null
          created_at?: string
          experience_feedback?: string | null
          experience_score?: number | null
          id?: number
          improvements?: string[] | null
          interview_id: string
          overall_score: number
          problem_solving_feedback?: string | null
          problem_solving_score?: number | null
          strengths?: string[] | null
          summary: string
          tavus_conversation_id?: string | null
          technical_feedback?: string | null
          technical_score?: number | null
        }
        Update: {
          communication_feedback?: string | null
          communication_score?: number | null
          created_at?: string
          experience_feedback?: string | null
          experience_score?: number | null
          id?: number
          improvements?: string[] | null
          interview_id?: string
          overall_score?: number
          problem_solving_feedback?: string | null
          problem_solving_score?: number | null
          strengths?: string[] | null
          summary?: string
          tavus_conversation_id?: string | null
          technical_feedback?: string | null
          technical_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: true
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback_processing_jobs: {
        Row: {
          callback_url: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          interview_id: string
          started_at: string
          status: string
          tavus_conversation_id: string
        }
        Insert: {
          callback_url: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          interview_id: string
          started_at?: string
          status: string
          tavus_conversation_id: string
        }
        Update: {
          callback_url?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          interview_id?: string
          started_at?: string
          status?: string
          tavus_conversation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_processing_jobs_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: true
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          }
        ]
      }
      interview_types: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: number
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: number
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          completed_at: string | null
          company: string | null
          created_at: string
          difficulty_level_id: number
          duration: number
          experience_level_id: number | null
          feedback_processing_status: string | null
          feedback_requested_at: string | null
          id: string
          interview_type_id: number
          llm_generated_context: string | null
          llm_generated_greeting: string | null
          prompt_error: string | null
          prompt_status: string | null
          role: string
          scheduled_at: string
          score: number | null
          status: string
          tavus_conversation_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          company?: string | null
          created_at?: string
          difficulty_level_id: number
          duration?: number
          experience_level_id?: number | null
          feedback_processing_status?: string | null
          feedback_requested_at?: string | null
          id?: string
          interview_type_id: number
          llm_generated_context?: string | null
          llm_generated_greeting?: string | null
          prompt_error?: string | null
          prompt_status?: string | null
          role: string
          scheduled_at: string
          score?: number | null
          status: string
          tavus_conversation_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          company?: string | null
          created_at?: string
          difficulty_level_id?: number
          duration?: number
          experience_level_id?: number | null
          feedback_processing_status?: string | null
          feedback_requested_at?: string | null
          id?: string
          interview_type_id?: number
          llm_generated_context?: string | null
          llm_generated_greeting?: string | null
          prompt_error?: string | null
          prompt_status?: string | null
          role?: string
          scheduled_at?: string
          score?: number | null
          status?: string
          tavus_conversation_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_difficulty_level_id_fkey"
            columns: ["difficulty_level_id"]
            isOneToOne: false
            referencedRelation: "difficulty_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_experience_level_id_fkey"
            columns: ["experience_level_id"]
            isOneToOne: false
            referencedRelation: "experience_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interview_type_id_fkey"
            columns: ["interview_type_id"]
            isOneToOne: false
            referencedRelation: "interview_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      llm_prompt_cache: {
        Row: {
          company: string
          conversational_context: string
          created_at: string
          custom_greeting: string
          difficulty_level: string
          experience_level: string
          id: string
          interview_type: string
          last_used_at: string
          role: string
          use_count: number
        }
        Insert: {
          company: string
          conversational_context: string
          created_at?: string
          custom_greeting: string
          difficulty_level: string
          experience_level: string
          id?: string
          interview_type: string
          last_used_at?: string
          role: string
          use_count?: number
        }
        Update: {
          company?: string
          conversational_context?: string
          created_at?: string
          custom_greeting?: string
          difficulty_level?: string
          experience_level?: string
          id?: string
          interview_type?: string
          last_used_at?: string
          role?: string
          use_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_confirmed: boolean | null
          id: string
          last_login_at: string | null
          name: string
          subscription_expires_at: string | null
          subscription_tier: string | null
          total_conversation_minutes: number | null
          updated_at: string | null
          used_conversation_minutes: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_confirmed?: boolean | null
          id: string
          last_login_at?: string | null
          name: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_conversation_minutes?: number | null
          updated_at?: string | null
          used_conversation_minutes?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_confirmed?: boolean | null
          id?: string
          last_login_at?: string | null
          name?: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_conversation_minutes?: number | null
          updated_at?: string | null
          used_conversation_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cache_prompt: {
        Args: {
          p_interview_type: string
          p_role: string
          p_company: string
          p_experience_level: string
          p_difficulty_level: string
          p_conversational_context: string
          p_custom_greeting: string
        }
        Returns: boolean
      }
      complete_feedback_processing: {
        Args: {
          p_tavus_conversation_id: string
          p_overall_score: number
          p_summary: string
          p_strengths: string[]
          p_improvements: string[]
          p_technical_score?: number
          p_communication_score?: number
          p_problem_solving_score?: number
          p_experience_score?: number
          p_technical_feedback?: string
          p_communication_feedback?: string
          p_problem_solving_feedback?: string
          p_experience_feedback?: string
        }
        Returns: boolean
      }
      fail_feedback_processing: {
        Args: {
          p_tavus_conversation_id: string
          p_error_message: string
        }
        Returns: boolean
      }
      get_cached_prompt: {
        Args: {
          p_interview_type: string
          p_role: string
          p_company: string
          p_experience_level: string
          p_difficulty_level: string
        }
        Returns: {
          conversational_context: string
          custom_greeting: string
          is_cached: boolean
        }[]
      }
      set_total_conversation_minutes: {
        Args: {
          user_id: string
          new_total: number
        }
        Returns: boolean
      }
      start_feedback_processing: {
        Args: {
          p_interview_id: string
          p_tavus_conversation_id: string
          p_callback_url: string
        }
        Returns: boolean
      }
      trigger_prompt_generation: {
        Args: {
          p_interview_id: string
          p_interview_type: string
          p_role: string
          p_company: string
          p_experience_level: string
          p_difficulty_level: string
          p_user_name: string
        }
        Returns: boolean
      }
      update_conversation_minutes: {
        Args: {
          user_id: string
          minutes_to_add: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}