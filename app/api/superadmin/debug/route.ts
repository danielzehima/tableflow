import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export async function GET() {
  const rawEmail = process.env.SUPERADMIN_EMAIL ?? "";
  const cleanEmail = rawEmail.replace(/^﻿/, "").trim();
  const rawPassword = process.env.SUPERADMIN_PASSWORD ?? "";
  const cleanPassword = rawPassword.replace(/^﻿/, "").trim();
  const rawSecret = process.env.AUTH_SECRET ?? "";
  const cleanSecret = rawSecret.replace(/^﻿/, "");

  const cookieStore = await cookies();
  const token = cookieStore.get("sb-admin-token")?.value ?? "";

  let tokenInfo: Record<string, unknown> = { present: false };
  if (token) {
    const dot = token.lastIndexOf(".");
    if (dot !== -1) {
      const encoded = token.slice(0, dot);
      const sig = token.slice(dot + 1);
      const expected = createHmac("sha256", cleanSecret).update(encoded).digest("hex");
      let sigOk = false;
      try {
        const a = Buffer.from(expected, "hex");
        const b = Buffer.from(sig, "hex");
        sigOk = a.length === b.length && timingSafeEqual(a, b);
      } catch { /* ignore */ }

      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Record<string, unknown>;
      } catch { /* ignore */ }

      const payloadEmail = (payload.email as string) ?? "";
      tokenInfo = {
        present: true,
        sigValid: sigOk,
        expired: typeof payload.exp === "number" ? payload.exp < Date.now() : "unknown",
        role: payload.role,
        emailInToken: payloadEmail,
        emailInEnv: cleanEmail,
        emailMatch: payloadEmail === cleanEmail,
        emailInTokenLen: payloadEmail.length,
        emailInEnvLen: cleanEmail.length,
      };
    }
  }

  return NextResponse.json({
    env: {
      emailRawLen: rawEmail.length,
      emailCleanLen: cleanEmail.length,
      emailFirstCharCode: rawEmail.charCodeAt(0),
      passwordSet: cleanPassword.length > 0,
      passwordLen: cleanPassword.length,
      secretSet: cleanSecret.length > 0,
    },
    token: tokenInfo,
  });
}
