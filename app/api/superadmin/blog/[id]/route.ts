import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../../lib/admin-auth";
import { supabase } from "../../../../lib/supabase-server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();
  const allowed = ["title", "slug", "excerpt", "content", "category", "cover_emoji", "author", "published", "reading_time"] as const;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabase
    .from("articles")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { id } = await params;
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
