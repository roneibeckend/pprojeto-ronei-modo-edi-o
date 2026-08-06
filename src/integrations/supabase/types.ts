export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      course_enrollments: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          badge: string | null
          content_url: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_ai_generated: boolean | null
          is_locked: boolean | null
          price: number | null
          teacher_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id: string
          is_ai_generated?: boolean | null
          is_locked?: boolean | null
          price?: number | null
          teacher_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_locked?: boolean | null
          price?: number | null
          teacher_name?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ebook_enrollments: {
        Row: {
          created_at: string
          ebook_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ebook_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ebook_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_enrollments_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_locked: boolean | null
          original_price: number | null
          pages_count: number | null
          price: number | null
          title: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id: string
          is_locked?: boolean | null
          original_price?: number | null
          pages_count?: number | null
          price?: number | null
          title: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean | null
          original_price?: number | null
          pages_count?: number | null
          price?: number | null
          title?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          created_at: string | null
          credentials: Json
          id: string
          name: string
          settings: Json
          status: boolean | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          credentials?: Json
          id?: string
          name: string
          settings?: Json
          status?: boolean | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          credentials?: Json
          id?: string
          name?: string
          settings?: Json
          status?: boolean | null
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          is_locked: boolean | null
          module_id: string | null
          order_index: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id: string
          is_locked?: boolean | null
          module_id?: string | null
          order_index?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          is_locked?: boolean | null
          module_id?: string | null
          order_index?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          link: string | null
          materials_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["live_class_status"] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          materials_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["live_class_status"] | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          materials_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["live_class_status"] | null
          title?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          order_index: number | null
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id: string
          order_index?: number | null
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          category: string | null
          cost: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          name: string
          prep_time: string | null
          profit_margin: string | null
          sell_price: string | null
          steps: string[] | null
          yield: string | null
        }
        Insert: {
          category?: string | null
          cost?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name: string
          prep_time?: string | null
          profit_margin?: string | null
          sell_price?: string | null
          steps?: string[] | null
          yield?: string | null
        }
        Update: {
          category?: string | null
          cost?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name?: string
          prep_time?: string | null
          profit_margin?: string | null
          sell_price?: string | null
          steps?: string[] | null
          yield?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["support_sender_type"]
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["support_sender_type"]
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["support_sender_type"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          id: string
          legacy_message: string | null
          priority: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          legacy_message?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          legacy_message?: string | null
          priority?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      save_assistant_response: {
        Args: { p_content: string; p_ticket_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student"
      difficulty_level: "Fácil" | "Médio" | "Avançado"
      integration_type: "ia" | "payment"
      live_class_status: "scheduled" | "live" | "completed"
      support_sender_type: "student" | "assistant" | "support_agent" | "system"
      support_ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
      difficulty_level: ["Fácil", "Médio", "Avançado"],
      integration_type: ["ia", "payment"],
      live_class_status: ["scheduled", "live", "completed"],
      support_sender_type: ["student", "assistant", "support_agent", "system"],
      support_ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
