import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { verifyPassword, createToken, COOKIE } from "../../../lib/auth";
import type { Role } from "../../../lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const { data: user, error: dbError } = await supabase
    .from("restaurant_users")
    .select("id, restaurant_id, name, email, password_hash, role, active")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (dbError) {
    return NextResponse.json({ error: "Erreur de connexion à la base de données" }, { status: 500 });
  }

  if (!user || !user.active) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  const token = createToken({
    userId: user.id,
    restaurantId: user.restaurant_id,
    role: user.role as Role,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
