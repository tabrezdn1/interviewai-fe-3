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
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          created_at: string
          updated_at: string | null
          total_conversation_minutes: number
          used_conversation_minutes: number
          subscription_tier: string
          subscription_expires_at: string | null
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
          total_conversation_minutes?: number
          used_conversation_minutes?: number
          subscription_tier?: string
          subscription_expires_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
          total_conversation_minutes?: number
          used_conversation_minutes?: number
          subscription_tier?: string
          subscription_expires_at?: string | null
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
      interview_types: {
        Row: {
          id: number
          type: string
          title: string
          description: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: number
          type: string
          title: string
          description: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: number
          type?: string
          title?: string
          description?: string
          icon?: string
          created_at?: string
        }
        Relationships: []
      }
      experience_levels: {
        Row: {
          id: number
          value: string
          label: string
          created_at: string
        }
        Insert: {
          id?: number
          value: string
          label: string
          created_at?: string
        }
        Update: {
          id?: number
          value?: string
          label?: string
          created_at?: string
        }
        Relationships: []
      }
      difficulty_levels: {
        Row: {
          id: number
          value: string
          label: string
          created_at: string
        }
        Insert: {
          id?: number
          value: string
          label: string
          created_at?: string
        }
        Update: {
          id?: number
          value?: string
          label?: string
          created_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          id: string
          user_id: string
          title: string
          company: string | null
          role: string
          interview_type_id: number
          experience_level_id: number | null
          difficulty_level_id: number
          status: string
          score: number | null
          scheduled_at: string
          completed_at: string | null
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          company?: string | null
          role: string
          interview_type_id: number
          experience_level_id?: number | null
          difficulty_level_id: number
          status: string
          score?: number | null
          scheduled_at: string
          completed_at?: string | null
          duration: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          company?: string | null
          role?: string
          interview_type_id?: number
          experience_level_id?: number | null
          difficulty_level_id?: number
          status?: string
          score?: number | null
          scheduled_at?: string
          completed_at?: string | null
          duration?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "interviews_experience_level_id_fkey"
            columns: ["experience_level_id"]
            isOneToOne: false
            referencedRelation: "experience_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_difficulty_level_id_fkey"
            columns: ["difficulty_level_id"]
            isOneToOne: false
            referencedRelation: "difficulty_levels"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: number
          interview_type_id: number
          text: string
          hint: string | null
          created_at: string
        }
        Insert: {
          id?: number
          interview_type_id: number
          text: string
          hint?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          interview_type_id?: number
          text?: string
          hint?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_interview_type_id_fkey"
            columns: ["interview_type_id"]
            isOneToOne: false
            referencedRelation: "interview_types"
            referencedColumns: ["id"]
          }
        ]
      }
      interview_questions: {
        Row: {
          id: number
          interview_id: string
          question_id: number
          answer: string | null
          analysis: string | null
          score: number | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: number
          interview_id: string
          question_id: number
          answer?: string | null
          analysis?: string | null
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          interview_id?: string
          question_id?: number
          answer?: string | null
          analysis?: string | null
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: number
          interview_id: string
          overall_score: number
          summary: string
          strengths: string[] | null
          improvements: string[] | null
          technical_score: number | null
          communication_score: number | null
          problem_solving_score: number | null
          experience_score: number | null
          technical_feedback: string | null
          communication_feedback: string | null
          problem_solving_feedback: string | null
          experience_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: number
          interview_id: string
          overall_score: number
          summary: string
          strengths?: string[] | null
          improvements?: string[] | null
          technical_score?: number | null
          communication_score?: number | null
          problem_solving_score?: number | null
          experience_score?: number | null
          technical_feedback?: string | null
          communication_feedback?: string | null
          problem_solving_feedback?: string | null
          experience_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          interview_id?: string
          overall_score?: number
          summary?: string
          strengths?: string[] | null
          improvements?: string[] | null
          technical_score?: number | null
          communication_score?: number | null
          problem_solving_score?: number | null
          experience_score?: number | null
          technical_feedback?: string | null
          communication_feedback?: string | null
          problem_solving_feedback?: string | null
          experience_feedback?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_tavus_conversation: {
        Args: {
          conversation_request: Json
        }
        Returns: Json
      }
      end_tavus_conversation: {
        Args: {
          conversation_id: string
        }
        Returns: void
      }
      delete_tavus_persona: {
        Args: {
          persona_id: string
        }
        Returns: void
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