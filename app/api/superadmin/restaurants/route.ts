import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { verifyAdminApi } from "../../../lib/admin-auth";

export async function GET() {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, email, phone, cuisine, status, plan, plan_expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
