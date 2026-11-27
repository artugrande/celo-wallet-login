import { createClient } from "@supabase/supabase-js"

// Browser client. The publishable key is public by design: row level security protects the data.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)

export const CELO_CHAIN_ID = 42220 // Celo mainnet

export type CustomClaims = { address?: string; chain?: string; network?: string; domain?: string; statement?: string }
