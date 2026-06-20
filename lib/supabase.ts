/**
 * lib/supabase.ts
 *
 * Two Supabase clients:
 *  - `supabase`      → public/anon client (safe to use in the browser)
 *  - `supabaseAdmin` → service-role client (server-side only — NEVER import
 *                      this in Client Components or expose it to the browser)
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Public client — uses the anon key (Row Level Security applies)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// ---------------------------------------------------------------------------
// Admin client — uses the service role key (bypasses RLS)
// ⚠️  SERVER-SIDE ONLY. Never import this file in Client Components.
// ---------------------------------------------------------------------------
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _supabaseAdmin: ReturnType<typeof createClient> | undefined;

function ensureAdminClient() {
  if (!_supabaseAdmin) {
    if (!supabaseServiceRoleKey) {
      if (typeof window !== "undefined") {
        throw new Error(
          "supabaseAdmin is not available in the browser — SUPABASE_SERVICE_ROLE_KEY is a server-only env var"
        );
      }
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not configured as an environment variable"
      );
    }
    _supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createClient>,
  { get: (_, prop) => (ensureAdminClient() as any)[prop] }
);
