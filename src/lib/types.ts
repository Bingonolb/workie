export type Condition = "neuf" | "excellent" | "tres_bon" | "bon" | "correct";
export type WatchStatus = "available" | "paused" | "swapped";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  identity_verified: boolean;
  identity_verified_at: string | null;
  created_at: string;
}

export interface Watch {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number | null;
  condition: Condition;
  description: string | null;
  photos: string[];
  city: string | null;
  country: string | null;
  status: WatchStatus;
  purchase_price: number | null;
  currency: "EUR" | "USD" | "GBP" | "CHF";
  has_proof_of_purchase: boolean;
  has_certificate_authenticity: boolean;
  has_box: boolean;
  has_papers: boolean;
  created_at: string;
  updated_at: string;
}

export interface WatchWithOwner extends Watch {
  owner: Pick<Profile, "id" | "username" | "avatar_url" | "city" | "country">;
}

export interface SwapMatch {
  id: string;
  user_a_id: string;
  user_b_id: string;
  watch_a_id: string;
  watch_b_id: string;
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

// Minimal Database type placeholder so the typed Supabase client compiles.
// Run `supabase gen types typescript` against the project for full type-safety,
// then replace this with the generated type for full autocompletion.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export const CONDITION_LABELS: Record<Condition, string> = {
  neuf: "Neuf",
  excellent: "Excellent état",
  tres_bon: "Très bon état",
  bon: "Bon état",
  correct: "État correct",
};
