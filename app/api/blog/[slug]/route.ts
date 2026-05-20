import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  return NextResponse.json(data);
}
