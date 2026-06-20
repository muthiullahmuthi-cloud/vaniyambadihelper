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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// Admin client — uses the service role key (bypasses RLS)
// ⚠️  SERVER-SIDE ONLY. Never import this file in Client Components.
// ---------------------------------------------------------------------------
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Prevent the admin client from persisting sessions in cookies/localStorage
    autoRefreshToken: false,
    persistSession: false,
  },
});
