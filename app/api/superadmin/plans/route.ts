import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/admin-auth";
import { supabase } from "../../../lib/supabase-server";

export async function GET() {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { data, error } = await supabase
    .from("plan_settings")
    .select("*")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
