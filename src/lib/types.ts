export interface Company {
  id: string;
  zefix_uid: string | null;
  name: string;
  sector: string;
  subsector: string | null;
  city: string;
  canton: string | null;
  employee_range: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  founded_year: number | null;
  avg_salary_chf: number | null;
  avg_rating: number;
  review_count: number;
  tags: string[];
  is_verified: boolean;
  is_subscribed: boolean;
  score: number;
  profile_score: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  company_id: string;
  user_id: string | null;
  rating_overall: number;
  rating_culture: number | null;
  rating_management: number | null;
  rating_worklife: number | null;
  rating_career: number | null;
  title: string | null;
  content: string;
  pros: string | null;
  cons: string | null;
  job_title: string | null;
  salary_chf: number | null;
  is_current: boolean;
  is_anonymous: boolean;
  employment_type: "cdi" | "cdd" | "stage" | "alternance" | "freelance" | null;
  duration_range: string | null;
  work_mode: "présentiel" | "hybride" | "remote" | null;
  would_recommend: "oui" | "non" | "ca_depend" | null;
  knew_before: string | null;
  start_year: number | null;
  end_year: number | null;
  helpful_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  role: "user" | "admin" | null;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          admin_note: string | null; body_text: string | null; click_count: number
          company_id: string; cpm_chf: number; created_at: string | null
          cta_label: string; cta_url: string; daily_budget_chf: number
          end_date: string | null; format: string; headline: string; id: string
          image_url: string; impression_count: number; spent_chf: number
          start_date: string; status: string; target_cantons: string[]
          target_sectors: string[]; total_budget_chf: number; updated_at: string | null
        }
        Insert: {
          admin_note?: string | null; body_text?: string | null; click_count?: number
          company_id: string; cpm_chf: number; created_at?: string | null
          cta_label?: string; cta_url: string; daily_budget_chf: number
          end_date?: string | null; format: string; headline: string; id?: string
          image_url: string; impression_count?: number; spent_chf?: number
          start_date: string; status?: string; target_cantons?: string[]
          target_sectors?: string[]; total_budget_chf: number; updated_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["ad_campaigns"]["Insert"]>
        Relationships: [{ foreignKeyName: "ad_campaigns_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      ad_clicks: {
        Row: { campaign_id: string; clicked_at: string | null; id: string; user_id: string | null; viewer_canton: string | null }
        Insert: { campaign_id: string; clicked_at?: string | null; id?: string; user_id?: string | null; viewer_canton?: string | null }
        Update: Partial<Database["public"]["Tables"]["ad_clicks"]["Insert"]>
        Relationships: [{ foreignKeyName: "ad_clicks_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "ad_campaigns"; referencedColumns: ["id"] }]
      }
      ad_impressions: {
        Row: { campaign_id: string; id: string; user_id: string | null; viewed_at: string | null; viewer_canton: string | null; viewer_city: string | null }
        Insert: { campaign_id: string; id?: string; user_id?: string | null; viewed_at?: string | null; viewer_canton?: string | null; viewer_city?: string | null }
        Update: Partial<Database["public"]["Tables"]["ad_impressions"]["Insert"]>
        Relationships: [{ foreignKeyName: "ad_impressions_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "ad_campaigns"; referencedColumns: ["id"] }]
      }
      companies: {
        Row: {
          avg_rating: number | null; avg_salary_chf: number | null; canton: string | null
          city: string; claimed_by: string | null; cover_url: string | null
          created_at: string | null; description: string | null; employee_range: string | null
          founded_year: number | null; id: string; instagram_url: string | null
          is_subscribed: boolean | null; is_verified: boolean | null; linkedin_url: string | null
          logo_url: string | null; name: string; profile_score: number | null; review_count: number | null; score: number
          sector: string; stripe_customer_id: string | null; stripe_subscription_id: string | null
          subscription_cancel_at_period_end: boolean; subscription_ends_at: string | null; subsector: string | null; tags: string[] | null
          twitter_url: string | null; website_url: string | null; zefix_uid: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & { city: string; name: string; sector: string }
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>
        Relationships: []
      }
      company_claims: {
        Row: {
          company_id: string | null; company_name: string; company_website: string | null
          created_at: string | null; employee_range: string | null; first_name: string; id: string
          job_level: string; job_title: string; last_name: string; message: string | null
          reviewed_at: string | null; reviewed_by: string | null; status: string | null
          user_id: string | null; work_email: string; zefix_url: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["company_claims"]["Row"]> & { company_name: string; first_name: string; job_level: string; job_title: string; last_name: string; work_email: string }
        Update: Partial<Database["public"]["Tables"]["company_claims"]["Row"]>
        Relationships: [{ foreignKeyName: "company_claims_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      company_replies: {
        Row: { company_id: string; content: string; created_at: string | null; id: string; review_id: string; updated_at: string | null }
        Insert: { company_id: string; content: string; created_at?: string | null; id?: string; review_id: string; updated_at?: string | null }
        Update: Partial<Database["public"]["Tables"]["company_replies"]["Insert"]>
        Relationships: [
          { foreignKeyName: "company_replies_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] },
          { foreignKeyName: "company_replies_review_id_fkey"; columns: ["review_id"]; isOneToOne: true; referencedRelation: "reviews"; referencedColumns: ["id"] }
        ]
      }
      company_views: {
        Row: { company_id: string; id: string; user_id: string | null; viewed_at: string | null }
        Insert: { company_id: string; id?: string; user_id?: string | null; viewed_at?: string | null }
        Update: Partial<Database["public"]["Tables"]["company_views"]["Insert"]>
        Relationships: [{ foreignKeyName: "company_views_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      favorites: {
        Row: { company_id: string; created_at: string | null; user_id: string }
        Insert: { company_id: string; created_at?: string | null; user_id: string }
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>
        Relationships: [{ foreignKeyName: "favorites_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      job_apply_clicks: {
        Row: { clicked_at: string | null; company_id: string; id: string; job_id: string; viewer_canton: string | null }
        Insert: { clicked_at?: string | null; company_id: string; id?: string; job_id: string; viewer_canton?: string | null }
        Update: Partial<Database["public"]["Tables"]["job_apply_clicks"]["Insert"]>
        Relationships: [{ foreignKeyName: "job_apply_clicks_job_id_fkey"; columns: ["job_id"]; isOneToOne: false; referencedRelation: "job_offers"; referencedColumns: ["id"] }]
      }
      job_offers: {
        Row: {
          apply_click_count: number | null; apply_url: string | null; company_id: string; contract_type: string | null
          created_at: string | null; description: string | null; experience_level: string | null
          expires_at: string | null; id: string; is_active: boolean | null; location: string | null
          requirements: string | null; salary_range: string | null; title: string; view_count: number | null; work_mode: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["job_offers"]["Row"]> & { company_id: string; title: string }
        Update: Partial<Database["public"]["Tables"]["job_offers"]["Row"]>
        Relationships: [{ foreignKeyName: "job_offers_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      notifications: {
        Row: { body: string | null; created_at: string | null; data: Json | null; id: string; read: boolean | null; title: string; type: string; user_id: string }
        Insert: { body?: string | null; created_at?: string | null; data?: Json | null; id?: string; read?: boolean | null; title: string; type: string; user_id: string }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null; bio: string | null; canton: string | null; city: string | null
          claimed_company_id: string | null; country: string | null; created_at: string
          full_name: string | null; has_penalty_pass: boolean; has_seen_onboarding: boolean; id: string; identity_verified: boolean
          identity_verified_at: string | null; penalty_credits: number; role: string; stripe_verification_session_id: string | null
          updated_at: string; username: string
        }
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; username: string }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>
        Relationships: [{ foreignKeyName: "profiles_claimed_company_id_fkey"; columns: ["claimed_company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      reports: {
        Row: {
          id: string; created_at: string; reporter_id: string | null
          target_type: string; target_id: string; target_label: string | null
          category: string; explanation: string | null; status: string
        }
        Insert: {
          id?: string; created_at?: string; reporter_id?: string | null
          target_type: string; target_id: string; target_label?: string | null
          category: string; explanation?: string | null; status?: string
        }
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>
        Relationships: []
      }
      review_votes: {
        Row: { review_id: string; user_id: string }
        Insert: { review_id: string; user_id: string }
        Update: { review_id?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "review_votes_review_id_fkey"; columns: ["review_id"]; isOneToOne: false; referencedRelation: "reviews"; referencedColumns: ["id"] }]
      }
      reviews: {
        Row: {
          company_id: string; cons: string | null; content: string; created_at: string | null
          duration_range: string | null; employment_type: string | null; end_year: number | null
          helpful_count: number | null; id: string; is_anonymous: boolean | null
          is_current: boolean | null; job_title: string | null; knew_before: string | null
          pros: string | null; rating_career: number | null; rating_culture: number | null
          rating_management: number | null; rating_overall: number; rating_worklife: number | null
          salary_chf: number | null; start_year: number | null; title: string | null
          user_id: string | null; work_mode: string | null; would_recommend: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & { company_id: string; content: string; rating_overall: number }
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>
        Relationships: [{ foreignKeyName: "reviews_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
      score_events: {
        Row: { company_id: string; created_at: string | null; event_type: string; id: string; points: number; user_id: string }
        Insert: { company_id: string; created_at?: string | null; event_type: string; id?: string; points: number; user_id: string }
        Update: Partial<Database["public"]["Tables"]["score_events"]["Insert"]>
        Relationships: [{ foreignKeyName: "score_events_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      increment_ad_click: { Args: { p_campaign_id: string }; Returns: undefined }
      increment_ad_impression: { Args: { p_campaign_id: string }; Returns: undefined }
      increment_helpful: { Args: { review_id: string }; Returns: undefined }
      increment_job_apply_click: { Args: { job_id: string }; Returns: undefined }
      increment_penalty_credits: { Args: { uid: string; amount: number }; Returns: undefined }
      spend_penalty_credit: { Args: { uid: string }; Returns: boolean }
      list_distinct_brands: { Args: Record<string, never>; Returns: { brand: string }[] }
      show_limit: { Args: Record<string, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]

export const SECTOR_COLORS: Record<string, string> = {
  "Tech": "#8b5cf6",
  "Finance": "#3b82f6",
  "Assurances": "#0ea5e9",
  "Pharma": "#10b981",
  "Santé": "#34d399",
  "Conseil": "#f59e0b",
  "Industrie": "#64748b",
  "Automobile": "#6366f1",
  "Horlogerie": "#f97316",
  "Commerce": "#a855f7",
  "Alimentation": "#84cc16",
  "Agriculture": "#65a30d",
  "Éducation & Recherche": "#06b6d4",
  "Sports & Fashion": "#ec4899",
  "Transport": "#14b8a6",
  "Énergie": "#eab308",
  // Legacy aliases
  "Sports & Mode": "#ec4899",
  "Conseil & Services": "#f59e0b",
};

export const CANTON_NAMES: Record<string, string> = {
  "ZH": "Zürich",
  "BE": "Bern",
  "LU": "Lucerne",
  "UR": "Uri",
  "SZ": "Schwyz",
  "OW": "Obwalden",
  "NW": "Nidwalden",
  "GL": "Glarus",
  "ZG": "Zug",
  "FR": "Fribourg",
  "SO": "Soleure",
  "BS": "Bâle-Ville",
  "BL": "Bâle-Camp.",
  "SH": "Schaffhouse",
  "AR": "Appenzell A.Rh.",
  "AI": "Appenzell I.Rh.",
  "SG": "St-Gallen",
  "GR": "Grisons",
  "AG": "Argovie",
  "TG": "Thurgovie",
  "TI": "Tessin",
  "VD": "Vaud",
  "VS": "Valais",
  "NE": "Neuchâtel",
  "GE": "Genève",
  "JU": "Jura",
};

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"];
