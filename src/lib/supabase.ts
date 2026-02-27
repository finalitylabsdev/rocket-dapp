import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
const RESOLVED_SUPABASE_PUBLIC_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_ANON_KEY;
export const SUPABASE_PUBLISHABLE_KEY = RESOLVED_SUPABASE_PUBLIC_KEY ?? '';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
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
