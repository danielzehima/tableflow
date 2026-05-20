import { cookies } from "next/headers";
import { supabase } from "./supabase-server";
import { createToken, verifyToken, COOKIE } from "./auth";
import type { SessionPayload } from "./auth";

// ── Cookie helpers ───────────────────────────────────────────────

export async function setSessionCookie(payload: SessionPayload) {
  const token = createToken({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session as SessionPayload;
}

export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("restaurant_users")
    .select("id, name, email, role, active")
    .eq("id", session.userId)
    .eq("active", true)
    .single();
  return data ?? null;
}
