import { createClient } from "@supabase/supabase-js";

function stripBom(s: string): string {
  return (s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s).trim();
}

const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const serviceRoleKey = stripBom(process.env.SUPABASE_SERVICE_KEY ?? "");

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export { supabase as supabaseServer };
