import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase-server";

export async function GET() {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, category, cover_emoji, author, reading_time, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
