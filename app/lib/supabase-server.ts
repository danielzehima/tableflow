import { createClient, SupabaseClient } from "@supabase/supabase-js";

function stripBom(s: string): string {
  return (s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s).trim();
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const key = stripBom(process.env.SUPABASE_SERVICE_KEY ?? "");
  if (!url || !key) {
    throw new Error(
      "Supabase env vars manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY)"
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Proxy: toutes les méthodes sont résolues à l'usage, pas à l'import.
// Évite "Failed to collect page data" lors du build Next si les env vars
// ne sont pas disponibles au moment où Next analyse les routes.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

export const supabaseServer = supabase;
