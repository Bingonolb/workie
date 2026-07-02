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
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export type Database = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export const SECTOR_COLORS: Record<string, string> = {
  "Tech": "#8b5cf6",
  "Pharma": "#10b981",
  "Finance": "#3b82f6",
  "Conseil": "#f59e0b",
  "Sports & Fashion": "#ec4899",
  "Horlogerie": "#f97316",
  "Alimentation": "#84cc16",
  "Industrie": "#64748b",
  "Éducation & Recherche": "#06b6d4",
};

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "1001-5000", "5001-10000", "10001+"];
