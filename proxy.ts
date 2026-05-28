import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Superadmin guard ────────────────────────────────────────────
  if (
    pathname.startsWith("/superadmin") &&
    !pathname.startsWith("/superadmin/login") &&
    !pathname.startsWith("/api/superadmin/login")
  ) {
    const token = request.cookies.get("sb-admin-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/superadmin/login", request.url));
    }
  }

  // ── Admin guard ─────────────────────────────────────────────────
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login"
  ) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // ── Dashboard gérant guard ──────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("tf_session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Forward pathname so server layouts can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/api/superadmin/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};
