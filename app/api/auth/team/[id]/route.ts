import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase-server";
import { canManageTeam } from "../../../../lib/auth";
import { getSession } from "../../../../lib/auth-server";
import type { Role } from "../../../../lib/auth";

// PATCH /api/auth/team/[id] — modifier rôle ou statut
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageTeam(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Prevent modifying the owner
  const { data: target } = await supabase
    .from("restaurant_users")
    .select("role, restaurant_id")
    .eq("id", id)
    .single();

  if (!target || target.restaurant_id !== session.restaurantId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Impossible de modifier le propriétaire" }, { status: 403 });
  }

  const allowed: Role[] = ["manager", "waiter", "cashier"];
  const update: Record<string, unknown> = {};
  if (body.role && allowed.includes(body.role as Role)) update.role = body.role;
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.phone === "string") update.phone = body.phone.trim() || null;

  const { data, error } = await supabase
    .from("restaurant_users")
    .update(update)
    .eq("id", id)
    .select("id, name, email, phone, role, active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/auth/team/[id] — supprimer un collaborateur
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageTeam(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  const { data: target } = await supabase
    .from("restaurant_users")
    .select("role, restaurant_id")
    .eq("id", id)
    .single();

  if (!target || target.restaurant_id !== session.restaurantId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Impossible de supprimer le propriétaire" }, { status: 403 });
  }

  const { error } = await supabase.from("restaurant_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
