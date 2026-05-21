import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

// Supprime le BOM (U+FEFF) ajouté par certains éditeurs sur les variables d'env
function stripBom(s: string): string {
  return (s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s).trim();
}

const SECRET = stripBom(process.env.AUTH_SECRET ?? "tableflow-change-in-production");
const ADMIN_EMAIL = stripBom(process.env.SUPERADMIN_EMAIL ?? "");

type AdminSession = { email: string; role: string; exp: number };

function verifyAdminToken(token: string): AdminSession | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(encoded).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(sig, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  let payload: AdminSession;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as AdminSession;
  } catch {
    return null;
  }
  if (payload.exp < Date.now()) return null;
  if (payload.role !== "superadmin") return null;
  if (payload.email !== ADMIN_EMAIL) return null;
  return payload;
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-admin-token")?.value;
  if (!token) redirect("/superadmin/login");
  const session = verifyAdminToken(token);
  if (!session) redirect("/superadmin/login");
  return session;
}

export async function verifyAdminApi(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-admin-token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const session = verifyAdminToken(token);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return null;
}
