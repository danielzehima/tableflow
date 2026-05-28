import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  return token && token === process.env.ADMIN_SECRET;
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json();
  const { title, slug, excerpt, content, category, cover_emoji, author, published, reading_time } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Titre et slug requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title,
      slug,
      excerpt: excerpt ?? "",
      content: content ?? "",
      category: category ?? "Article",
      cover_emoji: cover_emoji ?? "📝",
      author: author ?? "Équipe TableFlow",
      published: published ?? false,
      reading_time: reading_time ?? 5,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
