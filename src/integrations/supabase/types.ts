export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          id: string
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
          id?: string
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
          id?: string
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_overdue_submissions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_title: string
          notification_message: string
          notification_type?: string
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
