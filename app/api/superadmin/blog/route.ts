import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/admin-auth";
import { supabase } from "../../../lib/supabase-server";

export async function GET() {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const body = await req.json();
  const { title, slug, excerpt, content, category, cover_emoji, author, published, reading_time } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Titre et slug requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("articles")
    .insert({ title, slug, excerpt: excerpt ?? "", content: content ?? "", category: category ?? "Article", cover_emoji: cover_emoji ?? "📝", author: author ?? "Équipe TableFlow", published: published ?? false, reading_time: reading_time ?? 5 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
