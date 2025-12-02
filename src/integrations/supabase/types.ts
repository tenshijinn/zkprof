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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          blob_id: string
          created_at: string
          id: string
          is_active: boolean
          owner_wallet: string
          platform_id: string
          revoked_at: string | null
        }
        Insert: {
          blob_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_wallet: string
          platform_id: string
          revoked_at?: string | null
        }
        Update: {
          blob_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          owner_wallet?: string
          platform_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platform_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      access_sessions: {
        Row: {
          blob_id: string
          consent_given: boolean | null
          created_at: string
          expires_at: string
          id: string
          nda_hash: string | null
          nda_message: string
          nda_signature: string
          payment_amount_usd: number
          platform_id: string
          signer_ip: string | null
          signer_user_agent: string | null
          signing_timestamp: string | null
          solana_memo_signature: string | null
          viewer_wallet: string
        }
        Insert: {
          blob_id: string
          consent_given?: boolean | null
          created_at?: string
          expires_at: string
          id?: string
          nda_hash?: string | null
          nda_message: string
          nda_signature: string
          payment_amount_usd: number
          platform_id: string
          signer_ip?: string | null
          signer_user_agent?: string | null
          signing_timestamp?: string | null
          solana_memo_signature?: string | null
          viewer_wallet: string
        }
        Update: {
          blob_id?: string
          consent_given?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          nda_hash?: string | null
          nda_message?: string
          nda_signature?: string
          payment_amount_usd?: number
          platform_id?: string
          signer_ip?: string | null
          signer_user_agent?: string | null
          signing_timestamp?: string | null
          solana_memo_signature?: string | null
          viewer_wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_sessions_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platform_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      encrypted_photos: {
        Row: {
          blob_id: string
          commitment: string
          created_at: string | null
          encrypted_image_url: string
          encrypted_key: string
          id: string
          iv: string
          user_public_key: string
          zk_proof: string | null
          zk_public_signals: string[] | null
        }
        Insert: {
          blob_id: string
          commitment: string
          created_at?: string | null
          encrypted_image_url: string
          encrypted_key: string
          id?: string
          iv: string
          user_public_key: string
          zk_proof?: string | null
          zk_public_signals?: string[] | null
        }
        Update: {
          blob_id?: string
          commitment?: string
          created_at?: string | null
          encrypted_image_url?: string
          encrypted_key?: string
          id?: string
          iv?: string
          user_public_key?: string
          zk_proof?: string | null
          zk_public_signals?: string[] | null
        }
        Relationships: []
      }
      nda_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          template_content: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          template_content: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          template_content?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nft_mints: {
        Row: {
          blob_id: string | null
          created_at: string | null
          id: string
          metadata_uri: string
          mint_address: string
          payment_signature: string
          user_public_key: string
          zk_proof: string | null
          zk_public_signals: string[] | null
        }
        Insert: {
          blob_id?: string | null
          created_at?: string | null
          id?: string
          metadata_uri: string
          mint_address: string
          payment_signature: string
          user_public_key: string
          zk_proof?: string | null
          zk_public_signals?: string[] | null
        }
        Update: {
          blob_id?: string | null
          created_at?: string | null
          id?: string
          metadata_uri?: string
          mint_address?: string
          payment_signature?: string
          user_public_key?: string
          zk_proof?: string | null
          zk_public_signals?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_mints_blob_id_fkey"
            columns: ["blob_id"]
            isOneToOne: false
            referencedRelation: "encrypted_photos"
            referencedColumns: ["blob_id"]
          },
        ]
      }
      platform_credit_topups: {
        Row: {
          amount_usd: number
          created_at: string | null
          id: string
          platform_id: string
          solana_signature: string
        }
        Insert: {
          amount_usd: number
          created_at?: string | null
          id?: string
          platform_id: string
          solana_signature: string
        }
        Update: {
          amount_usd?: number
          created_at?: string | null
          id?: string
          platform_id?: string
          solana_signature?: string
        }
        Relationships: []
      }
      platform_credit_transactions: {
        Row: {
          amount_usd: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          platform_id: string
          transaction_signature: string | null
          transaction_type: string
        }
        Insert: {
          amount_usd: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          platform_id: string
          transaction_signature?: string | null
          transaction_type: string
        }
        Update: {
          amount_usd?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          platform_id?: string
          transaction_signature?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_credit_transactions_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platform_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_registrations: {
        Row: {
          api_key_hash: string
          contact_email: string
          created_at: string
          credit_balance_usd: number
          id: string
          is_active: boolean
          platform_domain: string
          platform_name: string
          updated_at: string
        }
        Insert: {
          api_key_hash: string
          contact_email: string
          created_at?: string
          credit_balance_usd?: number
          id?: string
          is_active?: boolean
          platform_domain: string
          platform_name: string
          updated_at?: string
        }
        Update: {
          api_key_hash?: string
          contact_email?: string
          created_at?: string
          credit_balance_usd?: number
          id?: string
          is_active?: boolean
          platform_domain?: string
          platform_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
