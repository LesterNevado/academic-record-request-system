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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          details: string | null
          id: string
          related_id: string | null
          related_user_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: string | null
          id?: string
          related_id?: string | null
          related_user_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: string | null
          id?: string
          related_id?: string | null
          related_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_related_user_id_fkey1"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          certificate_copies: number | null
          certificate_ctc: boolean
          certificate_selected: boolean
          certification_copies: number | null
          certification_ctc: boolean
          certification_details: string | null
          certification_selected: boolean
          client_reference_id: string | null
          coa_copies: number | null
          coa_ctc: boolean
          coa_selected: boolean
          coe_copies: number | null
          coe_ctc: boolean
          coe_selected: boolean
          com_copies: number | null
          com_ctc: boolean
          com_selected: boolean
          contact_number: string
          created_at: string
          home_address: string
          id: string
          notes: string | null
          others_copies: number | null
          others_ctc: boolean
          others_details: string | null
          others_selected: boolean
          pickup_date: string | null
          processed_by: string | null
          purpose: string
          registration_form_copies: number | null
          registration_form_ctc: boolean
          registration_form_details: string | null
          registration_form_selected: boolean
          soa_copies: number | null
          soa_ctc: boolean
          soa_selected: boolean
          status: string
          student_name: string
          student_number: string
          transaction_id: string | null
          transcript_copies: number | null
          transcript_ctc: boolean
          transcript_selected: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_copies?: number | null
          certificate_ctc?: boolean
          certificate_selected?: boolean
          certification_copies?: number | null
          certification_ctc?: boolean
          certification_details?: string | null
          certification_selected?: boolean
          client_reference_id?: string | null
          coa_copies?: number | null
          coa_ctc?: boolean
          coa_selected?: boolean
          coe_copies?: number | null
          coe_ctc?: boolean
          coe_selected?: boolean
          com_copies?: number | null
          com_ctc?: boolean
          com_selected?: boolean
          contact_number: string
          created_at?: string
          home_address: string
          id?: string
          notes?: string | null
          others_copies?: number | null
          others_ctc?: boolean
          others_details?: string | null
          others_selected?: boolean
          pickup_date?: string | null
          processed_by?: string | null
          purpose: string
          registration_form_copies?: number | null
          registration_form_ctc?: boolean
          registration_form_details?: string | null
          registration_form_selected?: boolean
          soa_copies?: number | null
          soa_ctc?: boolean
          soa_selected?: boolean
          status?: string
          student_name: string
          student_number: string
          transaction_id?: string | null
          transcript_copies?: number | null
          transcript_ctc?: boolean
          transcript_selected?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_copies?: number | null
          certificate_ctc?: boolean
          certificate_selected?: boolean
          certification_copies?: number | null
          certification_ctc?: boolean
          certification_details?: string | null
          certification_selected?: boolean
          client_reference_id?: string | null
          coa_copies?: number | null
          coa_ctc?: boolean
          coa_selected?: boolean
          coe_copies?: number | null
          coe_ctc?: boolean
          coe_selected?: boolean
          com_copies?: number | null
          com_ctc?: boolean
          com_selected?: boolean
          contact_number?: string
          created_at?: string
          home_address?: string
          id?: string
          notes?: string | null
          others_copies?: number | null
          others_ctc?: boolean
          others_details?: string | null
          others_selected?: boolean
          pickup_date?: string | null
          processed_by?: string | null
          purpose?: string
          registration_form_copies?: number | null
          registration_form_ctc?: boolean
          registration_form_details?: string | null
          registration_form_selected?: boolean
          soa_copies?: number | null
          soa_ctc?: boolean
          soa_selected?: boolean
          status?: string
          student_name?: string
          student_number?: string
          transaction_id?: string | null
          transcript_copies?: number | null
          transcript_ctc?: boolean
          transcript_selected?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          client_reference_id: string | null
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          payment_status: string
          request_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_reference_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          payment_status: string
          request_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_reference_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          payment_status?: string
          request_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_transaction_if_not_exists: {
        Args: {
          p_user_id: string
          p_request_id: string
          p_amount: number
          p_payment_status: string
          p_payment_method: string
          p_stripe_session_id: string
        }
        Returns: Json
      }
      get_processor_name: {
        Args: { processor_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_details: string
          p_related_user_id?: string
          p_related_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "student" | "faculty"
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
      app_role: ["admin", "student", "faculty"],
    },
  },
} as const
