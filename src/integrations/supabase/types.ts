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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          description: string | null
          earned_at: string | null
          id: string
          learner_id: string
          points_awarded: number | null
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          learner_id: string
          points_awarded?: number | null
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          learner_id?: string
          points_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_factors: {
        Row: {
          created_at: string | null
          document_score: number | null
          engagement_score: number | null
          feedback_score: number | null
          id: string
          learner_id: string
          month: number
          overall_score: number | null
          timesheet_score: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          document_score?: number | null
          engagement_score?: number | null
          feedback_score?: number | null
          id?: string
          learner_id: string
          month: number
          overall_score?: number | null
          timesheet_score?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          document_score?: number | null
          engagement_score?: number | null
          feedback_score?: number | null
          id?: string
          learner_id?: string
          month?: number
          overall_score?: number | null
          timesheet_score?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      cvs: {
        Row: {
          additional_info: string | null
          created_at: string
          cv_name: string
          education: Json | null
          id: string
          is_published: boolean | null
          learner_id: string
          personal_info: Json | null
          skills: string[] | null
          updated_at: string
          work_experience: Json | null
        }
        Insert: {
          additional_info?: string | null
          created_at?: string
          cv_name: string
          education?: Json | null
          id?: string
          is_published?: boolean | null
          learner_id: string
          personal_info?: Json | null
          skills?: string[] | null
          updated_at?: string
          work_experience?: Json | null
        }
        Update: {
          additional_info?: string | null
          created_at?: string
          cv_name?: string
          education?: Json | null
          id?: string
          is_published?: boolean | null
          learner_id?: string
          personal_info?: Json | null
          skills?: string[] | null
          updated_at?: string
          work_experience?: Json | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          learner_id: string
          submission_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          learner_id: string
          submission_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          learner_id?: string
          submission_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "feedback_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_submissions: {
        Row: {
          created_at: string | null
          due_date: string
          edited_at: string | null
          id: string
          is_editable_by_learner: boolean | null
          learner_id: string
          mentor_approved_at: string | null
          mentor_comments: string | null
          mentor_feedback: string | null
          mentor_rating: number | null
          month: number
          needs_mentor_review: boolean | null
          status: Database["public"]["Enums"]["compliance_status"] | null
          submission_data: Json | null
          submitted_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          due_date: string
          edited_at?: string | null
          id?: string
          is_editable_by_learner?: boolean | null
          learner_id: string
          mentor_approved_at?: string | null
          mentor_comments?: string | null
          mentor_feedback?: string | null
          mentor_rating?: number | null
          month: number
          needs_mentor_review?: boolean | null
          status?: Database["public"]["Enums"]["compliance_status"] | null
          submission_data?: Json | null
          submitted_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          due_date?: string
          edited_at?: string | null
          id?: string
          is_editable_by_learner?: boolean | null
          learner_id?: string
          mentor_approved_at?: string | null
          mentor_comments?: string | null
          mentor_feedback?: string | null
          mentor_rating?: number | null
          month?: number
          needs_mentor_review?: boolean | null
          status?: Database["public"]["Enums"]["compliance_status"] | null
          submission_data?: Json | null
          submitted_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      learner_category_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          category_id: string
          id: string
          learner_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          category_id: string
          id?: string
          learner_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          category_id?: string
          id?: string
          learner_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          message: string
          message_type: string | null
          read_at: string | null
          sender_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          id: string
          learner_id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          period_month: number
          period_year: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          learner_id: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          period_month: number
          period_year: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          learner_id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          period_month?: number
          period_year?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          area_of_residence: string | null
          avatar_url: string | null
          compliance_score: number | null
          created_at: string | null
          date_of_birth: string | null
          disability_description: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          employer_name: string | null
          end_date: string | null
          full_name: string
          gender: string | null
          has_disability: boolean | null
          has_drivers_license: boolean | null
          has_own_transport: boolean | null
          id: string
          id_number: string | null
          languages: string[] | null
          learnership_program: string | null
          license_codes: string[] | null
          mentor_id: string | null
          nationality: string | null
          phone_number: string | null
          points: number | null
          public_transport_types: string[] | null
          race: string | null
          receives_stipend: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          start_date: string | null
          status: string | null
          stipend_amount: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area_of_residence?: string | null
          avatar_url?: string | null
          compliance_score?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          disability_description?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          employer_name?: string | null
          end_date?: string | null
          full_name: string
          gender?: string | null
          has_disability?: boolean | null
          has_drivers_license?: boolean | null
          has_own_transport?: boolean | null
          id: string
          id_number?: string | null
          languages?: string[] | null
          learnership_program?: string | null
          license_codes?: string[] | null
          mentor_id?: string | null
          nationality?: string | null
          phone_number?: string | null
          points?: number | null
          public_transport_types?: string[] | null
          race?: string | null
          receives_stipend?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          start_date?: string | null
          status?: string | null
          stipend_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area_of_residence?: string | null
          avatar_url?: string | null
          compliance_score?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          disability_description?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          employer_name?: string | null
          end_date?: string | null
          full_name?: string
          gender?: string | null
          has_disability?: boolean | null
          has_drivers_license?: boolean | null
          has_own_transport?: boolean | null
          id?: string
          id_number?: string | null
          languages?: string[] | null
          learnership_program?: string | null
          license_codes?: string[] | null
          mentor_id?: string | null
          nationality?: string | null
          phone_number?: string | null
          points?: number | null
          public_transport_types?: string[] | null
          race?: string | null
          receives_stipend?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          start_date?: string | null
          status?: string | null
          stipend_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_schedules: {
        Row: {
          class_timesheet_uploaded: boolean | null
          created_at: string | null
          due_date: string
          id: string
          learner_id: string
          month: number
          period: number
          uploaded_at: string | null
          work_timesheet_uploaded: boolean | null
          year: number
        }
        Insert: {
          class_timesheet_uploaded?: boolean | null
          created_at?: string | null
          due_date: string
          id?: string
          learner_id: string
          month: number
          period: number
          uploaded_at?: string | null
          work_timesheet_uploaded?: boolean | null
          year: number
        }
        Update: {
          class_timesheet_uploaded?: boolean | null
          created_at?: string | null
          due_date?: string
          id?: string
          learner_id?: string
          month?: number
          period?: number
          uploaded_at?: string | null
          work_timesheet_uploaded?: boolean | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_performance_points: {
        Args: { action_type: string; base_points: number; user_id: string }
        Returns: number
      }
      calculate_comprehensive_compliance: {
        Args: { target_month: number; target_year: number; user_id: string }
        Returns: number
      }
      check_missing_documents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_overdue_submissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          notification_message: string
          notification_title: string
          notification_type?: string
          target_user_id: string
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_biweekly_timesheets: {
        Args: { target_month: number; target_year: number; user_id: string }
        Returns: undefined
      }
      send_message_to_admins: {
        Args: { sender_id: string; message_title: string; message_content: string }
        Returns: string[]
      }
      update_compliance_score: {
        Args: { user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      compliance_status:
        | "pending"
        | "submitted"
        | "overdue"
        | "approved"
        | "rejected"
      document_type:
        | "attendance_proof"
        | "logbook_page"
        | "assessment"
        | "other"
        | "qualifications"
        | "certified_id"
        | "certified_proof_residence"
        | "proof_bank_account"
        | "drivers_license"
        | "cv_upload"
        | "work_attendance_log"
        | "class_attendance_proof"
        | "induction_form"
        | "popia_form"
        | "learner_consent_policy"
        | "employment_contract"
        | "learnership_contract"
      user_role: "learner" | "mentor" | "admin"
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
      compliance_status: [
        "pending",
        "submitted",
        "overdue",
        "approved",
        "rejected",
      ],
      document_type: [
        "attendance_proof",
        "logbook_page",
        "assessment",
        "other",
        "qualifications",
        "certified_id",
        "certified_proof_residence",
        "proof_bank_account",
        "drivers_license",
        "cv_upload",
        "work_attendance_log",
        "class_attendance_proof",
        "induction_form",
        "popia_form",
        "learner_consent_policy",
        "employment_contract",
        "learnership_contract",
      ],
      user_role: ["learner", "mentor", "admin"],
    },
  },
} as const
