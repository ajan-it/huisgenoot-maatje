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
      blackout_slots: {
        Row: {
          created_at: string
          days: Database["public"]["Enums"]["weekday"][]
          description: string | null
          end: string
          id: string
          label: string
          person_id: string
          start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days: Database["public"]["Enums"]["weekday"][]
          description?: string | null
          end: string
          id?: string
          label: string
          person_id: string
          start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: Database["public"]["Enums"]["weekday"][]
          description?: string | null
          end?: string
          id?: string
          label?: string
          person_id?: string
          start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blackout_slots_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      blackout_templates: {
        Row: {
          created_at: string
          days: Database["public"]["Enums"]["weekday"][]
          description: string | null
          end: string
          id: string
          label: string
          start: string
        }
        Insert: {
          created_at?: string
          days: Database["public"]["Enums"]["weekday"][]
          description?: string | null
          end: string
          id?: string
          label: string
          start: string
        }
        Update: {
          created_at?: string
          days?: Database["public"]["Enums"]["weekday"][]
          description?: string | null
          end?: string
          id?: string
          label?: string
          start?: string
        }
        Relationships: []
      }
      boosts_log: {
        Row: {
          channel: Database["public"]["Enums"]["boost_channel"]
          created_at: string
          escalation_used: boolean | null
          id: string
          interaction: Database["public"]["Enums"]["boost_interaction"] | null
          outcome: string | null
          person_id: string
          sent_at: string
          task_occurrence_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["boost_channel"]
          created_at?: string
          escalation_used?: boolean | null
          id?: string
          interaction?: Database["public"]["Enums"]["boost_interaction"] | null
          outcome?: string | null
          person_id: string
          sent_at?: string
          task_occurrence_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["boost_channel"]
          created_at?: string
          escalation_used?: boolean | null
          id?: string
          interaction?: Database["public"]["Enums"]["boost_interaction"] | null
          outcome?: string | null
          person_id?: string
          sent_at?: string
          task_occurrence_id?: string
        }
        Relationships: []
      }
      disruptions: {
        Row: {
          affected_person_ids: string[]
          consent_a: boolean | null
          consent_b: boolean | null
          created_at: string
          created_by: string
          household_id: string
          id: string
          nights_impacted: number
          notes: string | null
          type: Database["public"]["Enums"]["disruption_type"]
          updated_at: string
          week_start: string
        }
        Insert: {
          affected_person_ids?: string[]
          consent_a?: boolean | null
          consent_b?: boolean | null
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          nights_impacted?: number
          notes?: string | null
          type: Database["public"]["Enums"]["disruption_type"]
          updated_at?: string
          week_start: string
        }
        Update: {
          affected_person_ids?: string[]
          consent_a?: boolean | null
          consent_b?: boolean | null
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          nights_impacted?: number
          notes?: string | null
          type?: Database["public"]["Enums"]["disruption_type"]
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          boost_settings: Json | null
          created_at: string
          created_by: string
          id: string
          postcode: string | null
          settings: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          boost_settings?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          postcode?: string | null
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          boost_settings?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          postcode?: string | null
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      occurrences: {
        Row: {
          assigned_person: string | null
          backup_person_id: string | null
          boost_enabled: boolean | null
          created_at: string
          date: string
          difficulty_weight: number
          duration_min: number
          fairness_excused: boolean | null
          has_backup: boolean | null
          id: string
          is_critical: boolean | null
          plan_id: string
          rationale: Json | null
          start_time: string
          status: Database["public"]["Enums"]["occurrence_status"]
          task_id: string
          updated_at: string
          workload_units: number | null
        }
        Insert: {
          assigned_person?: string | null
          backup_person_id?: string | null
          boost_enabled?: boolean | null
          created_at?: string
          date: string
          difficulty_weight?: number
          duration_min?: number
          fairness_excused?: boolean | null
          has_backup?: boolean | null
          id?: string
          is_critical?: boolean | null
          plan_id: string
          rationale?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["occurrence_status"]
          task_id: string
          updated_at?: string
          workload_units?: number | null
        }
        Update: {
          assigned_person?: string | null
          backup_person_id?: string | null
          boost_enabled?: boolean | null
          created_at?: string
          date?: string
          difficulty_weight?: number
          duration_min?: number
          fairness_excused?: boolean | null
          has_backup?: boolean | null
          id?: string
          is_critical?: boolean | null
          plan_id?: string
          rationale?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["occurrence_status"]
          task_id?: string
          updated_at?: string
          workload_units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_assigned_person_fkey"
            columns: ["assigned_person"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          contact: Json | null
          created_at: string
          disliked_tasks: string[]
          first_name: string
          household_id: string
          id: string
          locale: Database["public"]["Enums"]["locale"]
          no_go_tasks: string[]
          role: Database["public"]["Enums"]["role_type"]
          updated_at: string
          weekly_time_budget: number
        }
        Insert: {
          contact?: Json | null
          created_at?: string
          disliked_tasks?: string[]
          first_name: string
          household_id: string
          id?: string
          locale?: Database["public"]["Enums"]["locale"]
          no_go_tasks?: string[]
          role: Database["public"]["Enums"]["role_type"]
          updated_at?: string
          weekly_time_budget?: number
        }
        Update: {
          contact?: Json | null
          created_at?: string
          disliked_tasks?: string[]
          first_name?: string
          household_id?: string
          id?: string
          locale?: Database["public"]["Enums"]["locale"]
          no_go_tasks?: string[]
          role?: Database["public"]["Enums"]["role_type"]
          updated_at?: string
          weekly_time_budget?: number
        }
        Relationships: [
          {
            foreignKeyName: "people_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          fairness_score: number | null
          household_id: string
          id: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          fairness_score?: number | null
          household_id: string
          id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          fairness_score?: number | null
          household_id?: string
          id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          country: string
          date: string
          id: string
          label: string
        }
        Insert: {
          country?: string
          date: string
          id?: string
          label: string
        }
        Update: {
          country?: string
          date?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["category_type"]
          created_at: string
          default_duration: number
          difficulty: number
          frequency: Database["public"]["Enums"]["frequency_type"]
          household_id: string | null
          id: string
          is_template: boolean
          name: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["category_type"]
          created_at?: string
          default_duration: number
          difficulty: number
          frequency: Database["public"]["Enums"]["frequency_type"]
          household_id?: string | null
          id?: string
          is_template?: boolean
          name: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["category_type"]
          created_at?: string
          default_duration?: number
          difficulty?: number
          frequency?: Database["public"]["Enums"]["frequency_type"]
          household_id?: string | null
          id?: string
          is_template?: boolean
          name?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_schedules: {
        Row: {
          id: string
          municipality: string | null
          pickup_day: Database["public"]["Enums"]["weekday"]
          postcode_prefix: string | null
          waste_type: string
        }
        Insert: {
          id?: string
          municipality?: string | null
          pickup_day: Database["public"]["Enums"]["weekday"]
          postcode_prefix?: string | null
          waste_type: string
        }
        Update: {
          id?: string
          municipality?: string | null
          pickup_day?: Database["public"]["Enums"]["weekday"]
          postcode_prefix?: string | null
          waste_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_boost_needed: {
        Args: { occurrence_id: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { _household_id: string }
        Returns: boolean
      }
      log_boost_interaction: {
        Args: {
          channel_used: string
          interaction_type?: string
          occurrence_id: string
          outcome_text?: string
          person_id: string
        }
        Returns: string
      }
    }
    Enums: {
      boost_channel: "push" | "email" | "whatsapp" | "sms"
      boost_interaction:
        | "acknowledged"
        | "rescheduled"
        | "swapped"
        | "backup_requested"
        | "completed"
        | "missed"
      category_type:
        | "kitchen"
        | "bathroom"
        | "cleaning"
        | "admin"
        | "childcare"
        | "errands"
        | "maintenance"
        | "selfcare"
        | "social"
        | "garden"
        | "outdoor"
        | "organizing"
        | "health"
        | "safety"
      disruption_type:
        | "sick_child"
        | "childcare_issues"
        | "overtime"
        | "late_shifts"
        | "commute_delays"
        | "travel"
        | "guests"
        | "events"
        | "low_energy"
        | "mental_load"
        | "appliance_broken"
        | "repairs"
        | "other"
      frequency_type:
        | "daily"
        | "weekly"
        | "monthly"
        | "seasonal"
        | "quarterly"
        | "semiannual"
        | "annual"
      locale: "nl" | "en"
      occurrence_status: "scheduled" | "done" | "moved" | "backlog"
      plan_status: "draft" | "confirmed" | "sent"
      role_type: "adult" | "child"
      weekday: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
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
      boost_channel: ["push", "email", "whatsapp", "sms"],
      boost_interaction: [
        "acknowledged",
        "rescheduled",
        "swapped",
        "backup_requested",
        "completed",
        "missed",
      ],
      category_type: [
        "kitchen",
        "bathroom",
        "cleaning",
        "admin",
        "childcare",
        "errands",
        "maintenance",
        "selfcare",
        "social",
        "garden",
        "outdoor",
        "organizing",
        "health",
        "safety",
      ],
      disruption_type: [
        "sick_child",
        "childcare_issues",
        "overtime",
        "late_shifts",
        "commute_delays",
        "travel",
        "guests",
        "events",
        "low_energy",
        "mental_load",
        "appliance_broken",
        "repairs",
        "other",
      ],
      frequency_type: [
        "daily",
        "weekly",
        "monthly",
        "seasonal",
        "quarterly",
        "semiannual",
        "annual",
      ],
      locale: ["nl", "en"],
      occurrence_status: ["scheduled", "done", "moved", "backlog"],
      plan_status: ["draft", "confirmed", "sent"],
      role_type: ["adult", "child"],
      weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
  },
} as const
