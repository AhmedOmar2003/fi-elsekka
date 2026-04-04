import "server-only"

import { createClient } from "@supabase/supabase-js"
import type { Promotion } from "@/services/promotionsService"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getPublicServerSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key are required.")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function fetchActivePromotionServer(): Promise<Promotion | null> {
  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return null
  }

  return data
}
