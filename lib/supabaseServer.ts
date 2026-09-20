import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client using the service role key. Never import this into a
 * client component — it bypasses Row Level Security, so every function that
 * uses it (see scoreLogic.ts, drawEngine.ts, charityLogic.ts) is responsible
 * for checking auth/ownership itself before calling the DB.
 */
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
