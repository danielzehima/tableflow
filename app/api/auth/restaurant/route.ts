import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, plan, plan_expires_at, status")
    .eq("id", session.restaurantId)
    .single();

  if (!data) return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  return NextResponse.json(data);
}
