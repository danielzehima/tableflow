import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("restaurants")
    .update({ status: "suspended" })
    .eq("status", "active")
    .neq("plan", "free")
    .not("plan_expires_at", "is", null)
    .lt("plan_expires_at", now)
    .select("id, name, plan, plan_expires_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    suspended: data?.length ?? 0,
    restaurants: data,
    checked_at: now,
  });
}
