import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = (process.env.AUTH_SECRET ?? "tableflow-change-in-production").replace(/^﻿/, "");

function createAdminToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, role: "superadmin", exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const adminEmail = (process.env.SUPERADMIN_EMAIL ?? "").replace(/^﻿/, "").trim();
  const adminPassword = (process.env.SUPERADMIN_PASSWORD ?? "").replace(/^﻿/, "").trim();

  if (!safeEqual(email, adminEmail) || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const token = createAdminToken(email);
  const cookieStore = await cookies();
  cookieStore.set("sb-admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.json({ ok: true });
}
