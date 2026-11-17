import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../../config/env.js";

export function getSupabaseClient() {
  const env = getEnv();
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
