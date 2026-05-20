import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { verifyPassword } from "../../../lib/auth";
import type { Role } from "../../../lib/auth";
import { setSessionCookie } from "../../../lib/auth-server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("restaurant_users")
    .select("id, restaurant_id, name, email, password_hash, role, active")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (!user || !user.active) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
  }

  await setSessionCookie({
    userId: user.id,
    restaurantId: user.restaurant_id,
    role: user.role as Role,
    name: user.name,
    exp: 0, // set inside setSessionCookie
  });

  return NextResponse.json({ ok: true, role: user.role });
}
