import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { getSession } from "../../../../lib/auth-server";
import { canViewStats } from "../../../../lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/dashboard/chats/[id] — staff sends a message
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canViewStats(session.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Verify session belongs to this restaurant
  const { data: chatSession } = await supabase
    .from("chat_sessions")
    .select("id, status")
    .eq("id", id)
    .eq("restaurant_id", session.restaurantId)
    .single();

  if (!chatSession) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (chatSession.status === "closed") return NextResponse.json({ error: "Session fermée" }, { status: 400 });

  const { error } = await supabase.from("chat_messages").insert({
    session_id: id,
    sender: "staff",
    staff_name: session.name,
    content: content.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/dashboard/chats/[id] — close a chat session
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canViewStats(session.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const { error } = await supabase
    .from("chat_sessions")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("restaurant_id", session.restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
