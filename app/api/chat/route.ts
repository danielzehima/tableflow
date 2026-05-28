import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

// POST /api/chat — create a new chat session for a visitor
export async function POST(req: NextRequest) {
  const { restaurantId, visitorName } = await req.json();
  if (!restaurantId) return NextResponse.json({ error: "restaurantId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ restaurant_id: restaurantId, visitor_name: visitorName ?? "Visiteur" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessionId: data.id });
}
