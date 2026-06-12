import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stripBom(s: string) {
  return (s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s).trim();
}

/** Accepte l'auth admin (admin_token) OU superadmin (sb-admin-token HMAC) */
async function isAuthorized(): Promise<boolean> {
  const jar = await cookies();

  // 1. Admin simple
  const adminToken = jar.get("admin_token")?.value;
  if (adminToken && adminToken === process.env.ADMIN_SECRET) return true;

  // 2. Superadmin HMAC
  const saToken = jar.get("sb-admin-token")?.value;
  if (saToken) {
    const SECRET = stripBom(process.env.AUTH_SECRET ?? "tableflow-change-in-production");
    const dot = saToken.lastIndexOf(".");
    if (dot !== -1) {
      const encoded = saToken.slice(0, dot);
      const sig     = saToken.slice(dot + 1);
      const expected = createHmac("sha256", SECRET).update(encoded).digest("hex");
      try {
        const a = Buffer.from(expected, "hex");
        const b = Buffer.from(sig, "hex");
        if (a.length === b.length && timingSafeEqual(a, b)) {
          const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
          if (payload.role === "superadmin" && payload.exp > Date.now()) return true;
        }
      } catch { /* invalide */ }
    }
  }

  return false;
}

/**
 * POST /api/revalidate/blog
 * Body : { slug?: string }
 * Vide le cache Next.js de la liste et de l'article (si slug fourni).
 */
export async function POST(req: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { slug?: string };

  revalidatePath("/blog");
  if (body.slug) revalidatePath(`/blog/${body.slug}`);

  return NextResponse.json({
    ok: true,
    revalidated: body.slug ? ["/blog", `/blog/${body.slug}`] : ["/blog"],
  });
}
