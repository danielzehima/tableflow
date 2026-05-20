import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { verifyAdminApi } from "../../../../lib/admin-auth";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Props) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { id } = await params;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !restaurant) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const [{ count: orders }, { count: reservations }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("restaurant_id", id),
    supabase.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", id),
  ]);

  return NextResponse.json({ ...restaurant, _orders: orders ?? 0, _reservations: reservations ?? 0 });
}

export async function PATCH(req: Request, { params }: Props) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  const allowed = ["status", "plan", "plan_expires_at", "name", "email"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Props) {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  const { id } = await params;

  const { error } = await supabase.from("restaurants").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
