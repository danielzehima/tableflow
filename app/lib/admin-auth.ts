import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-admin-token")?.value;

  if (!token) redirect("/superadmin/login");

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user || user.email !== ADMIN_EMAIL) {
    redirect("/superadmin/login");
  }

  return user;
}

export async function verifyAdminApi(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-admin-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return null;
}
