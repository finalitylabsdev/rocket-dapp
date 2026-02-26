import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface LeaderboardEntry {
  id: string;
  wallet_address: string;
  rockets_launched: number;
  et_burned: number;
  eth_earned: number;
  rank: number;
  prev_rank: number;
  season: number;
  updated_at: string;
}
