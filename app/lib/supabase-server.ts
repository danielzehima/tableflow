import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export { supabase as supabaseServer };
