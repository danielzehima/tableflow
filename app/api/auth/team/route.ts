import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { hashPassword, canManageTeam } from "../../../lib/auth";
import { getSession } from "../../../lib/auth-server";
import type { Role } from "../../../lib/auth";

// GET /api/auth/team — liste les membres du restaurant
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("restaurant_users")
    .select("id, name, email, phone, role, active, created_at")
    .eq("restaurant_id", session.restaurantId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/auth/team — ajouter un collaborateur
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageTeam(session.role)) {
    return NextResponse.json({ error: "Seul le propriétaire peut gérer l'équipe" }, { status: 403 });
  }

  const { name, email, password, role, phone } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }

  const validRoles: Role[] = ["manager", "waiter", "cashier"];
  if (!validRoles.includes(role as Role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Mot de passe : minimum 8 caractères" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("restaurant_users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("restaurant_users")
    .insert({
      restaurant_id: session.restaurantId,
      name,
      email: email.toLowerCase().trim(),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      password_hash: hashPassword(password),
      role,
      active: true,
    })
    .select("id, name, email, phone, role, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
