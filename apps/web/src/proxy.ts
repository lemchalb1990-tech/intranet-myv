import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/uploads/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdmin =
    payload.role === "SUPER_ADMIN" || payload.role === "EXECUTIVE";
  const isClient = payload.role === "CLIENT";

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (pathname.startsWith("/portal") && !isClient) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname === "/") {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
    if (isClient) return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
