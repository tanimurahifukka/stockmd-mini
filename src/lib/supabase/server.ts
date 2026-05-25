import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (_client) return _client;

  // Inside the app container, NEXT_PUBLIC_SUPABASE_URL (=127.0.0.1) points to
  // the container itself, not the host. Prefer SUPABASE_URL_SERVER for
  // server-side requests; fall back to the public URL for non-container hosts.
  const url =
    process.env.SUPABASE_URL_SERVER || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === "changeme") {
    throw new Error(
      "Supabase env not configured. Set NEXT_PUBLIC_SUPABASE_URL (browser-facing) and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env. When the app runs in Docker, also set SUPABASE_URL_SERVER (e.g. http://host.docker.internal:54321).",
    );
  }

  _client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
