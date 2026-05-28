import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";
import { canViewStats } from "../../../lib/auth";

// GET /api/dashboard/chats — list all chat sessions for the restaurant (staff)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canViewStats(session.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "open";

  const { data, error } = await supabase
    .from("chat_sessions")
    .select(`
      id, visitor_name, status, created_at, updated_at,
      chat_messages ( id, sender, content, created_at )
    `)
    .eq("restaurant_id", session.restaurantId)
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chats: data });
}
