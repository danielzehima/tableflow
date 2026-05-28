import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

type Ctx = { params: Promise<{ sessionId: string }> };

// GET /api/chat/[sessionId] — fetch messages + session status (visitor polls this)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { sessionId } = await params;

  const [{ data: session }, { data: msgs, error }] = await Promise.all([
    supabase.from("chat_sessions").select("status").eq("id", sessionId).single(),
    supabase
      .from("chat_messages")
      .select("id, sender, staff_name, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

  return NextResponse.json({ messages: msgs ?? [], status: session.status });
}

// POST /api/chat/[sessionId] — send a message (visitor only via public route)
export async function POST(req: NextRequest, { params }: Ctx) {
  const { sessionId } = await params;
  const { content, visitorName } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Verify session exists and is open
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (session.status === "closed") return NextResponse.json({ error: "Session fermée" }, { status: 400 });

  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    sender: "visitor",
    content: content.trim(),
    staff_name: null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update visitor name if provided
  if (visitorName) {
    await supabase
      .from("chat_sessions")
      .update({ visitor_name: visitorName })
      .eq("id", sessionId);
  }

  return NextResponse.json({ ok: true });
}
