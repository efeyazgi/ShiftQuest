import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "./config";
import type { Database } from "./database.types";

const SUPABASE_SERVER_SECRET =
  process.env.SUPABASE_SECRET_KEY?.trim()
  || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  || "";

export const isSupabaseAdminConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVER_SECRET,
);

export function createAdminClient() {
  if (!isSupabaseAdminConfigured) {
    throw new Error("Supabase server secret is not configured.");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVER_SECRET, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
